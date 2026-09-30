import { InternalOrder } from "../types/index.js";

/**
 * Order Repository Interface
 * Supports swappable storage implementations (e.g. Memory, PostgreSQL, MySQL).
 * Note: Default In-Memory implementation resets on server restart.
 */
export interface IOrderRepository {
  save(order: InternalOrder): Promise<InternalOrder>;
  findById(id: string): Promise<InternalOrder | undefined>;
  findByRazorpayOrderId(razorpayOrderId: string): Promise<InternalOrder | undefined>;
  updateStatus(
    id: string,
    status: InternalOrder["status"],
    razorpayPaymentId?: string,
  ): Promise<InternalOrder | undefined>;
}

export class InMemoryOrderRepository implements IOrderRepository {
  private orders = new Map<string, InternalOrder>();
  private razorpayIndex = new Map<string, string>(); // razorpayOrderId -> internalOrderId

  async save(order: InternalOrder): Promise<InternalOrder> {
    const clone = structuredClone(order);
    this.orders.set(order.id, clone);
    this.razorpayIndex.set(order.razorpayOrderId, order.id);
    return structuredClone(clone);
  }

  async findById(id: string): Promise<InternalOrder | undefined> {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : undefined;
  }

  async findByRazorpayOrderId(
    razorpayOrderId: string,
  ): Promise<InternalOrder | undefined> {
    const internalId = this.razorpayIndex.get(razorpayOrderId);
    if (!internalId) return undefined;
    return this.findById(internalId);
  }

  async updateStatus(
    id: string,
    status: InternalOrder["status"],
    razorpayPaymentId?: string,
  ): Promise<InternalOrder | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (razorpayPaymentId) {
      order.razorpayPaymentId = razorpayPaymentId;
    }

    this.orders.set(id, order);
    return structuredClone(order);
  }

  // Helper for test cleanup
  clear(): void {
    this.orders.clear();
    this.razorpayIndex.clear();
  }
}

export const orderRepository: IOrderRepository = new InMemoryOrderRepository();
