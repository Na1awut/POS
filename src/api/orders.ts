import { fetchClient } from './client';
import { OrderState } from '../reducers/order-reducer';

export const createOrder = async (orderState: OrderState) => {
  const subtotal = orderState.order.reduce((total, item) => total + item.quantity * item.price, 0);
  const discountAmount = subtotal * ((orderState.discount || 0) / 100);
  const discountedSubTotal = subtotal - discountAmount;
  const tipAmount = discountedSubTotal * ((orderState.tip || 0) / 100);
  const total = discountedSubTotal + tipAmount;

  const orderPayload = {
    subtotal,
    discount_percent: orderState.discount || 0,
    discount_amount: discountAmount,
    tip_percent: orderState.tip || 0,
    tip_amount: tipAmount,
    total,
    items: orderState.order.map((item) => ({
      id: item.id,
      name_th: item.name_th || item.name,
      name_en: item.name_en || item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  return fetchClient('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
};

export const getOrders = () => fetchClient('/orders');
