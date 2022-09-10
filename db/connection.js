const mongoose = require("mongoose");
const dbUri = process.env.dbUri;
mongoose
  .connect(dbUri)
  .then(() => {
    console.log("Database Connection");
  })
  .catch((e) => {
    console.log("Database Not Connected = ", e);
  });
