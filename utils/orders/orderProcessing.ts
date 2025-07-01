// utils/orders/orderProcessing.ts
import type { ExtendedOrder, OrderItem, OrderType } from "@/types/order";

/**
 * Processes a single raw order from DB/payload to the Order type used in UI
 */
export function processSingleOrder(
  orderData: any,
  customerList: any[]
): ExtendedOrder {
  try {
    const orderAny = orderData as any;

    // Ensure customerList is an array
    const safeCustomerList = Array.isArray(customerList) ? customerList : [];

    // Handle guest orders first
    let customerDetails;
    if (orderAny.is_guest_order) {
      const guestName = orderAny.guest_name 
        ? `Guest: ${orderAny.guest_name}` 
        : "Online Guest";
      
      customerDetails = {
        id: "guest",
        name: guestName,
        email: orderAny.guest_email || "guest@bettyorganic.com",
        phone: orderAny.guest_phone || null,
        role: "guest",
      };
    } else {
      // Handle regular customer orders
      const customerFromList = orderAny.customer_profile_id
        ? safeCustomerList.find((c) => c?.id === orderAny.customer_profile_id)
        : null;

      const fallbackCustomer = {
        id: "unknown",
        name: "Unknown Customer",
        email: "N/A",
        phone: null,
        role: "customer",
      };

      customerDetails = fallbackCustomer;
      
      if (customerFromList) {
        customerDetails = {
          id: customerFromList.id || "unknown",
          name: customerFromList.fullName || customerFromList.name || null,
          email: customerFromList.email || "N/A",
          phone: customerFromList.phone || null,
          role: "customer",
        };
      } else if (orderAny.customer) {
        customerDetails = {
          id: orderAny.customer.id || "unknown",
          name: orderAny.customer.fullName || orderAny.customer.name || null,
          email: orderAny.customer.email || "N/A",
          phone: orderAny.customer.phone || null,
          role: "customer",
        };
      }
    }

    // Safely process order items
    const rawOrderItems = orderAny.order_items || [];
    const orderItems = Array.isArray(rawOrderItems)
      ? rawOrderItems.map((item: any): OrderItem => {
          try {
            return {
              id: item?.id || "",
              product_id: item?.product_id || "",
              product_name:
                item?.product_name ||
                item?.products?.name ||
                "Unknown Product",
              quantity: item?.quantity || 0,
              price: item?.price || 0,
              order_id: item?.order_id || orderAny?.id || "",
              product: item?.products
                ? { name: item.products.name || "Unknown Product" }
                : undefined,
            };
          } catch (itemError) {
            console.error("Error processing order item:", itemError);
            return {
              id: "",
              product_id: "",
              product_name: "Error Processing Item",
              quantity: 0,
              price: 0,
              order_id: orderAny?.id || "",
            };
          }
        })
      : [];

    return {
      id: orderAny?.id ?? "",
      display_id: orderAny?.display_id || undefined,
      status: orderAny?.status ?? "pending",
      type: (orderAny?.type as OrderType) ?? "SALE",
      total_amount: orderAny?.total_amount ?? 0,
      created_at: orderAny?.created_at ?? new Date().toISOString(),
      updated_at: orderAny?.updated_at || undefined,
      profile_id: orderAny?.profile_id ?? "",
      customer_profile_id: orderAny?.customer_profile_id ?? "",
      // Guest order fields
      is_guest_order: orderAny?.is_guest_order ?? false,
      guest_name: orderAny?.guest_name ?? undefined,
      guest_email: orderAny?.guest_email ?? undefined,
      guest_phone: orderAny?.guest_phone ?? undefined,
      guest_address: orderAny?.guest_address ?? undefined,
      order_items: orderItems,
      items: orderItems,
      customer: customerDetails,
      profiles: orderAny?.seller
        ? {
            id: orderAny.seller.id || "",
            name: orderAny.seller.name || "",
            email: orderAny.seller.email || "",
            role: orderAny.seller.role || "user",
            phone: orderAny.seller.phone ?? null,
            avatar_url: orderAny.seller.avatar_url ?? null,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error in processSingleOrder:", error);
    // Safely log the orderData that caused the error
    try {
      const seen = new Set();
      const orderDataSafe = JSON.stringify(
        orderData,
        (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return "[Circular]";
            seen.add(value);
          }
          return value;
        },
        2
      );
      console.error("Problematic orderData:", orderDataSafe);
    } catch (jsonError) {
      console.error("Could not serialize orderData");
    }
    // Return a safe fallback order
    return {
      id: orderData?.id || "error-order",
      display_id: undefined,
      status: "error",
      type: "SALE",
      total_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: undefined,
      profile_id: "",
      customer_profile_id: "",
      order_items: [],
      items: [],
      customer: {
        id: "unknown",
        name: "Error Processing Customer",
        email: "N/A",
        phone: null,
        role: "customer",
      },
    };
  }
}

/**
 * Processes multiple raw orders from DB/payload to ExtendedOrder array
 */
export function processMultipleOrders(
  ordersData: any[],
  customerList: any[]
): ExtendedOrder[] {
  try {
    if (!Array.isArray(ordersData)) {
      console.warn("processMultipleOrders: ordersData is not an array");
      return [];
    }

    const safeCustomerList = Array.isArray(customerList) ? customerList : [];

    return ordersData.map((order, index) => {
      try {
        return processSingleOrder(order, safeCustomerList);
      } catch (error) {
        console.error(`Error processing order at index ${index}:`, error);
        // Safely log the order that caused the error
        try {
          const seen = new Set();
          const orderSafe = JSON.stringify(
            order,
            (key, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return "[Circular]";
                seen.add(value);
              }
              return value;
            },
            2
          );
          console.error(`Problematic order at index ${index}:`, orderSafe);
        } catch (jsonError) {
          console.error(`Could not serialize order at index ${index}`);
        }
        // Return a safe fallback order for this problematic entry
        return {
          id: order?.id || `error-order-${index}`,
          display_id: undefined,
          status: "error",
          type: "SALE" as OrderType,
          total_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: undefined,
          profile_id: "",
          customer_profile_id: "",
          order_items: [],
          items: [],
          customer: {
            id: "unknown",
            name: "Error Processing Customer",
            email: "N/A",
            phone: null,
            role: "customer",
          },
        };
      }
    });
  } catch (error) {
    console.error("Error in processMultipleOrders:", error);
    return [];
  }
}
