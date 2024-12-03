const router = require("express").Router();
const Request = require("../models/requestsModal");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");

router.post("/get-all-requests-by-user", authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [{ sender: req.body.userId }, { receiver: req.body.userId }],
    })
      .populate("sender")
      .populate("receiver")
      .sort({ createdAt: -1 });

    res.send({
      data: requests,
      message: "Requests fetched successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
      message: "Requests fetched failed",
    });
  }
});

//  send a request to another user

router.post("/send-request", authMiddleware, async (req, res) => {
  try {
    const { receiver, amount, description } = req.body;

    const request = new Request({
      sender: req.body.userId,
      receiver,
      amount,
      description,
    });

    await request.save();

    res.send({
      data: request,
      message: "Requests send successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
      message: "Requests send failed",
    });
  }
});

//  update a request status
router.post("/update-request-status", authMiddleware, async (req, res) => {
  try {
    if (req.body.status === "accepted") {
      //  create a transaction
      const newTransaction = new Transaction({
        sender: req.body.receiver._id,
        receiver: req.body.sender._id,
        amount: req.body.amount,
        reference: req.body.description,
        status: "success",
      });

      await newTransaction.save();

      // increase the amount from the sender
      await User.findByIdAndUpdate(req.body.sender._id, {
        $inc: { balance: req.body.amount },
      });

      // decrease the amount to the receiver
      await User.findByIdAndUpdate(req.body.receiver._id, {
        $inc: { balance: -req.body.amount },
      });
    }

    // update the request status for receiver & send
    await Request.findByIdAndUpdate(req.body._id, {
      status: req.body.status,
    });

    res.send({
      data: null,
      message: "Requests status update successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      data: error,
      message: "update request status failed",
      success: false,
    });
  }
});
module.exports = router;
