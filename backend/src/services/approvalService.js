// Approval service — handles approval routing and sequential steps

const prisma = require("../config/db");

const approvalService = {
  /**
   * Create a new approval request for a quotation
   */
  async createRequest(data, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify RFQ and Quotation exist
      const rfq = await tx.rFQ.findFirst({
        where: { id: data.rfqId, organizationId }
      });

      if (!rfq) {
        throw new Error("RFQ not found");
      }

      const quotation = await tx.quotation.findFirst({
        where: { id: data.quotationId, organizationId }
      });

      if (!quotation) {
        throw new Error("Quotation not found");
      }

      // Check if there is already a pending approval request for this RFQ
      const existingRequest = await tx.approvalRequest.findFirst({
        where: {
          rfqId: data.rfqId,
          status: "PENDING"
        }
      });

      if (existingRequest) {
        throw new Error("An active approval request is already pending for this RFQ.");
      }

      // 2. Resolve approvers in this organization
      const approvers = await tx.user.findMany({
        where: {
          organizationId,
          role: "APPROVER",
          status: "ACTIVE"
        },
        orderBy: { createdAt: "asc" }
      });

      // If no approver exists, search for ADMINs
      let resolvedApprovers = [...approvers];
      if (resolvedApprovers.length === 0) {
        const admins = await tx.user.findMany({
          where: {
            organizationId,
            role: "ADMIN",
            status: "ACTIVE"
          },
          orderBy: { createdAt: "asc" }
        });
        resolvedApprovers = admins;
      }

      if (resolvedApprovers.length === 0) {
        throw new Error("No active approvers or admins found in this organization to route the approval.");
      }

      // 3. Create approval request
      const approvalRequest = await tx.approvalRequest.create({
        data: {
          organizationId,
          rfqId: data.rfqId,
          quotationId: data.quotationId,
          requestedById: user.id,
          status: "PENDING"
        }
      });

      // 4. Create sequential steps based on total amount
      const grandTotal = quotation.grandTotal;
      const stepsToCreate = [];

      if (grandTotal <= 50000) {
        // Single level approval
        stepsToCreate.push({
          approvalRequestId: approvalRequest.id,
          approverId: resolvedApprovers[0].id,
          sequence: 1,
          status: "PENDING"
        });
      } else {
        // Multi-level approval (2 sequential levels)
        stepsToCreate.push({
          approvalRequestId: approvalRequest.id,
          approverId: resolvedApprovers[0].id,
          sequence: 1,
          status: "PENDING"
        });

        // Use a second approver if available, otherwise reuse or fallback to admin
        const secondApprover = resolvedApprovers[1] || resolvedApprovers[0];
        stepsToCreate.push({
          approvalRequestId: approvalRequest.id,
          approverId: secondApprover.id,
          sequence: 2,
          status: "PENDING" // This will start as pending, but logically resolved sequentially
        });
      }

      for (const step of stepsToCreate) {
        await tx.approvalStep.create({ data: step });
      }

      // 5. Update RFQ status to AWAITING_APPROVAL
      await tx.rFQ.update({
        where: { id: data.rfqId },
        data: { status: "AWAITING_APPROVAL" }
      });

      return tx.approvalRequest.findUnique({
        where: { id: approvalRequest.id },
        include: {
          steps: { include: { approver: { select: { id: true, name: true, email: true } } } },
          rfq: true,
          quotation: { include: { vendor: true } }
        }
      });
    }, { maxWait: 15000, timeout: 30000 });
  },

  /**
   * Get all approval requests scoped to organization and user role
   */
  async getAll(organizationId, user, filters = {}) {
    const where = { organizationId };

    // Approvers should see requests where they are assigned as a step
    if (user.role === "APPROVER") {
      where.steps = {
        some: {
          approverId: user.id
        }
      };
    }

    if (filters.status) where.status = filters.status;

    return prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        rfq: true,
        quotation: {
          include: {
            vendor: true,
            lineItems: { include: { rfqLineItem: true } }
          }
        },
        steps: {
          orderBy: { sequence: "asc" },
          include: { approver: { select: { id: true, name: true, email: true } } }
        }
      }
    });
  },

  /**
   * Get a single approval request
   */
  async getById(id, organizationId) {
    return prisma.approvalRequest.findFirst({
      where: { id, organizationId },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        rfq: true,
        quotation: {
          include: {
            vendor: true,
            lineItems: { include: { rfqLineItem: true } }
          }
        },
        steps: {
          orderBy: { sequence: "asc" },
          include: { approver: { select: { id: true, name: true, email: true } } }
        }
      }
    });
  },

  /**
   * Process a step decision (Approve or Reject)
   */
  async decideStep(requestId, remarks, status, organizationId, user) {
    return prisma.$transaction(async (tx) => {
      // 1. Find the request and include steps
      const request = await tx.approvalRequest.findFirst({
        where: { id: requestId, organizationId },
        include: {
          steps: { orderBy: { sequence: "asc" } },
          rfq: true
        }
      });

      if (!request) {
        throw new Error("Approval request not found");
      }

      if (request.status !== "PENDING") {
        throw new Error("This approval request has already been completed.");
      }

      // 2. Find the step assigned to this user that is pending
      const activeStep = request.steps.find(
        (step) => step.approverId === user.id && step.status === "PENDING"
      );

      if (!activeStep) {
        throw new Error("You do not have an active pending approval step for this request.");
      }

      // Enforce sequential approval. Ensure previous steps are already APPROVED
      const previousSteps = request.steps.filter(
        (step) => step.sequence < activeStep.sequence
      );

      const anyUnapproved = previousSteps.some((step) => step.status !== "APPROVED");
      if (anyUnapproved) {
        throw new Error("Previous approval levels must be completed before you can decide.");
      }

      // 3. Update the step
      await tx.approvalStep.update({
        where: { id: activeStep.id },
        data: {
          status,
          remarks,
          decidedAt: new Date()
        }
      });

      // Fetch updated steps
      const updatedSteps = await tx.approvalStep.findMany({
        where: { approvalRequestId: requestId },
        orderBy: { sequence: "asc" }
      });

      // 4. Determine new status of the overall request
      if (status === "REJECTED") {
        // If one level rejects, the entire request is rejected
        await tx.approvalRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            completedAt: new Date()
          }
        });

        // Set RFQ back to REJECTED status so they can select a different bid or edit
        await tx.rFQ.update({
          where: { id: request.rfqId },
          data: { status: "REJECTED" }
        });

        // Also reject the quotation itself
        await tx.quotation.update({
          where: { id: request.quotationId },
          data: { status: "REJECTED" }
        });

      } else if (status === "APPROVED") {
        // Check if all steps are approved
        const allApproved = updatedSteps.every((step) => step.status === "APPROVED");

        if (allApproved) {
          await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
              status: "APPROVED",
              completedAt: new Date()
            }
          });

          // Approve RFQ and set selectedQuotationId
          await tx.rFQ.update({
            where: { id: request.rfqId },
            data: {
              status: "APPROVED",
              selectedQuotationId: request.quotationId
            }
          });

          // Set Quotation status to ACCEPTED
          await tx.quotation.update({
            where: { id: request.quotationId },
            data: { status: "ACCEPTED" }
          });

          // Reject all other quotations for this RFQ
          await tx.quotation.updateMany({
            where: {
              rfqId: request.rfqId,
              id: { not: request.quotationId }
            },
            data: { status: "REJECTED" }
          });

        } else {
          // If not all approved, the request remains PENDING, but the next step is activated.
          // Note: In a sequential flow, steps are processed in order of sequence.
        }
      }

      return tx.approvalRequest.findUnique({
        where: { id: requestId },
        include: {
          steps: { include: { approver: { select: { id: true, name: true } } } },
          rfq: true,
          quotation: { include: { vendor: true } }
        }
      });
    }, { maxWait: 15000, timeout: 30000 });
  }
};

module.exports = approvalService;
