import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Helper function to validate address
const validateAddress = (address) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'zipcode', 'country', 'phone'];
  for (let field of requiredFields) {
    if (!address[field]) {
      return { valid: false, message: `${field} is required.` };
    }
  }
  return { valid: true };
};

// Create a new order
const placeOrder = async (req, res) => {
  const frontend_url = "https://khaana-express.web.app"; // Replace with your actual frontend URL
  
  try {
    // Validate the address format
    const addressValidation = validateAddress(req.body.address);
    if (!addressValidation.valid) {
      return res.status(400).json({ success: false, message: addressValidation.message });
    }

    // Create a new order in the database
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    await newOrder.save();

    // Clear the cart for the user
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Create line items for Stripe Checkout
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100 * 80, // Assuming price is in INR
      },
      quantity: item.quantity,
    }));

    // Add delivery charges
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 2 * 100 * 80, // Delivery charge is in INR
      },
      quantity: 1,
    });

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: 'payment',
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error placing the order:", error);
    res.json({ success: false, message: "Error while placing the order." });
  }
};

// Verify order payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Order placed successfully" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Order cancelled" });
    }
  } catch (error) {
    console.error("Error during verification:", error);
    res.json({ success: false, message: "Error while verifying the order." });
  }
};

// Get user orders
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.json({ success: false, message: "Error fetching user orders." });
  }
};

// Admin: List all orders
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.json({ success: false, message: "Error fetching orders." });
  }
};

// Admin: Update order status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.json({ success: false, message: "Error updating order status." });
  }
};

// Export all functions
export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
