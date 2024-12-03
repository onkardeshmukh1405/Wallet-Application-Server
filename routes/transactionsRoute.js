const router = require("express").Router();
const Transaction = require("../models/transactionModel");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/userModel");

const stripe = require("stripe")(process.env.stripe_key);
const { uuid } = require("uuidv4");

// transfer money from one account to other

router.post("/transfer-funds", authMiddleware, async (req, res) => {
  try {
    //  save the transaction
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();

    //  decrease the sender's balance
    await User.findByIdAndUpdate(req.body.sender, {
      $inc: { balance: -req.body.amount },
    });

    //  increase receiver's balance
    await User.findByIdAndUpdate(req.body.receiver, {
      $inc: { balance: req.body.amount },
    });

    res.send({
      message: "Transaction successful",
      data: newTransaction,
      success: true,
    });
  } catch (error) {
    res.send({
      message: "Transaction failed",
      data: error.message,
      success: false,
    });
  }
});

// verify receiver's account number
router.post("/verify-account", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.receiver });
    if (user) {
      res.send({
        message: "Account Verified",
        data: user,
        success: true,
      });
    } else {
      res.send({
        message: "Account not fount",
        data: null,
        success: false,
      });
    }
  } catch (error) {
    res.send({
      message: "Verify-account failed",
      data: error.message,
      success: false,
    });
  }
});

// get all transactions for a user

router.get(
  "/get-all-transactions-by-user",
  authMiddleware,
  async (req, res) => {
    try {
      const transactions = await Transaction.find({
        $or: [{ sender: req.body.userId }, { receiver: req.body.userId }],
      })
        .sort({ createdAt: -1 })
        .populate("sender")
        .populate("receiver");

      res.send({
        message: "Transactions fetched",
        data: transactions,
        success: true,
      });
    } catch (error) {
      res.send({
        message: "Transactions failed",
        data: error.message,
        success: false,
      });
    }
  }
);

// deposits funds using stripe
router.post("/deposit-funds", authMiddleware, async (req, res) => {
  try {
    const { token, amount } = req.body;

    // create a customer
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    // create a charge
    const charge = await stripe.charges.create(
      {
        amount: amount,
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        description: `Deposited to Wallet`,
      },
      {
        idempotencyKey: uuid(),
      }
    );
    //  save the transactions
    if (charge.status === "succeeded") {
      const newTransaction = new Transaction({
        sender: req.body.userId,
        receiver: req.body.userId,
        amount: amount,
        type: "deposit",
        reference: "stripe deposit",
        status: "success",
      });
      await newTransaction.save();

      // Increase the user's balance
      await User.findByIdAndUpdate(req.body.userId, {
        $inc: { balance: amount },
      });

      // console.log("customer-----", customer);
      // console.log("charge------", charge);
      // console.log("newTransaction------", newTransaction);

      res.send({
        message: "Transaction Successful",
        data: newTransaction,
        success: true,
      });
    } else {
      res.send({
        message: "Transaction failed",
        data: charge,
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.send({
      message: "deposits funds using stripe failed",
      data: error.message,
      success: false,
    });
  }
});

module.exports = router;
