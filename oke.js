import mongoose from "npm:mongoose";

export const connectMongo = async () => {
  await mongoose.connect("mongodb+srv://mukundsrajput:9fVCEq4RV1RV2Dmd@cluster0.bmxejth.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
  console.log("Connected to the database");
};

(async () => {
  await connectMongo();
})();