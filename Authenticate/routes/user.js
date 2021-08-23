const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const multipart = require("multer");
const upload = multipart();
const User = require("../models/User");
//const { VIP_1_month, VIP_2_month, VIP_3_month } = require("../models/vipticket");
const VIP = require("../models/vipticket");
const router = express.Router();
const { IsAuthenticated } = require("../config/Auth");

router.post("/register", upload.single("Avatar"), (req, res) => {
  const { Username, Password, CPassword, DeviceInfo } = req.body;
  deviceInfo = DeviceInfo ? DeviceInfo : "";
  avatar = req.file ? req.file.buffer : Buffer.alloc(0);
  if (!Username || !Password || !CPassword) {
    return res.send({ message: "please fill in all the required fields !", code: "nok" });
  }
  if (Password != CPassword) {
    return res.send({ message: "Passwords doesn't match !", code: "nok" });
  }
  if (Password.length < 6) {
    return res.send({ message: "Password must be greater than 6 character !", code: "nok" });
  }

  User.findOne({ Username: Username }).then((user) => {
    if (user) {
      res.send({ message: "This Username is taken, try another one!", code: "nok" });
    } else {
      const NewUser = new User({
        Username,
        Password,
        Avatar: avatar,
        DeviceInfo: deviceInfo,
      });
      bcrypt
        .genSalt(15)
        .then((salt) => {
          bcrypt
            .hash(NewUser.Password, salt)
            .then((hash) => {
              NewUser.Password = hash;
              NewUser.save()
                .then((_user) => {
                  res.send({ message: "register successfully done", code: "ok", user: _user });
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    }
  });
});

router.post("/loggin", upload.none(), passport.authenticate("local"), (req, res) => {
  VIP.findOne({ user_pk: req.user._id }).then((_vip) => {
    if (_vip) {
      res.send({ message: "You are logged in !", code: "ok", user: req.user, vip: _vip });
    } else {
      res.send({ message: "You are logged in !", code: "ok", user: req.user });
    }
  });
});
router.post("/checkloggin", IsAuthenticated, (req, res) => {
  VIP.findOne({ user_pk: req.user._id }).then((_vip) => {
    if (_vip) {
      res.send({ message: "You are logged in !", code: "ok", user: req.user, vip: _vip });
    } else {
      res.send({ message: "You are logged in !", code: "ok", user: req.user });
    }
  });
});
router.post("/loggout", (req, res) => {
  req.logout();
  res.send({ message: "You are logged out !", code: "ok" });
});
router.post("/leaderboard", upload.none(), IsAuthenticated, (req, res) => {
  limit = 30;
  if (req.body.limit) {
    lim = parseInt(req.body.limit);
    if (lim) {
      limit = lim;
    } else {
      limit = 30;
    }
  }
  User.find({})
    .sort({ Curency: -1 })
    .limit(limit)
    .then((result) => {
      res.send({ message: result, code: "ok" });
    })
    .catch((err) => {
      if (err) res.send({ message: "failed to retrieve players !", code: "tok" });
    });
});
router.post("/viptest", upload.none(), IsAuthenticated, (req, res) => {
  User.findOne({ Username: req.user.Username })
    .then((user) => {
      date = new Date(req.body.expires);
      const vip = new VIP({
        name: req.body.name,
        user_pk: user._id,
        expires: date,
      });
      vip.save();
      res.send({ vip });
    })
    .catch((err) => {
      res.send(err);
    });
});
router.post("/updateuser", upload.single("Avatar"), IsAuthenticated, (req, res) => {
  avatar = req.file ? req.file.buffer : req.user.Avatar;
  const name =
    req.body.Username && req.body.Username.length > 0 && req.body.Username != req.user.Username
      ? req.body.Username
      : "";
  const curency = req.body.Curency ? req.body.Curency : req.user.Curency;
  const deckofcard = req.body.DeckOfCard ? req.body.DeckOfCard : req.user.DeckOfCard;
  const background = req.body.Background ? req.body.Background : req.user.Background;
  User.findOne({ Username: name })
    .then((user) => {
      if (user) {
        res.send({ message: "this username already taken!", code: "nok" });
      } else {
        User.findOneAndUpdate(
          { Username: req.user.Username },
          {
            Username: name.length > 0 ? name : req.user.Username,
            Avatar: avatar,
            Curency: curency,
            DeckOfCard: deckofcard,
            Background: background,
          }
        )
          .then((user) => {
            User.findOne({ Username: name.length > 0 ? name : req.user.Username })
              .then((loser) => {
                VIP.findOne({ user_pk: req.user._id }).then((_vip) => {
                  if (_vip) {
                    res.send({ message: "User seccussfully updated !", code: "ok", user: loser, vip: _vip });
                  } else {
                    res.send({ message: "User seccussfully updated !", code: "ok", user: loser });
                  }
                });
              })
              .catch((err) => {
                res.send({ message: err.message, code: "nok" });
              });
          })
          .catch((err) => {
            res.send({ message: err.message, code: "nok" });
          });
      }
    })
    .catch((err) => {
      res.send({ message: err.message, code: "nok" });
    });
});
router.post("/updatecurency", upload.none(), IsAuthenticated, (req, res) => {
  if (!req.body.curency && !req.body.curency.length > 0) {
    res.send({ message: "value is invalid!", code: "nok" });
  } else {
    User.findOneAndUpdate({ Username: req.user.Username }, { Curency: req.body.curency }).then((user) => {
      res.send({ message: "user seccussfuly updated", code: "ok", user: user });
    });
  }
});
router.post("/verifyvip", IsAuthenticated, (req, res) => {
  VIP.findOne({ user_pk: req.user._id }).then((vip) => {
    if (vip) {
      res.send({ message: "VIP founded for this user", code: "ok", vip: vip });
    } else {
      res.send({ message: "VIP NOT founded for this user", code: "nok" });
    }
  });
});
module.exports = router;
