const TAX_RATE = 0.15; // 15%
const SHIPPING_COST = 50; // $50 flat rate

const calculatePrices = (orderItems) => {
  // Calculate items price
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + (item.price * item.quantity),
    0
  );

  // Calculate tax
  const taxPrice = Number((TAX_RATE * itemsPrice).toFixed(2));

  // Calculate total price
  const totalPrice = Number((itemsPrice + taxPrice + SHIPPING_COST).toFixed(2));

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    taxPrice,
    shippingPrice: SHIPPING_COST,
    totalPrice
  };
};

module.exports = { calculatePrices };