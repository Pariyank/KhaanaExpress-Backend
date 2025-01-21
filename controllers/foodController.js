import foodModel from "../models/foodModel.js"
import fs from 'fs'

//add food item 

const addFood = async (req, res) => {
  try {
    // Check if the file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    // Log the request body and file details
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    // Create a new food item
    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.file.filename,
    });

    // Save the food item to the database
    const savedFood = await food.save();
    console.log("Saved Food:", savedFood);

    res.status(201).json({ success: true, message: "Food added successfully", data: savedFood });
  } catch (error) {
    console.error("Error in addFood:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// all food list

const listFood = async (req, res) => {
    try {
      const foods = await foodModel.find({});
      res.json({ success: true, data: foods });
    } catch (error) {
      console.error("Error in listFood:", error.message);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  
  //remove food item

  const removeFood = async(req,res)=>{
      try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`,()=>{})

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food removed successfully" });
      } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error"})
      }
  }

export {addFood,listFood,removeFood}