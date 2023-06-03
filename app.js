const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1/todolistDB");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];

const itemSchema = {
  name: String // creating a table similar to SQL
};

const Item = mongoose.model("Item", itemSchema); // creating a collection

const item1 = new Item({
  name: "Welcome to your todo list"
})

const item2 = new Item({
  name: "Hit the + button to add a new item"
})         // creating data entries

const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems).then();

app.get("/", function (req, res) {

  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems).then();
      }
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    })
    .catch((err) => {
      console.log(err);
    })

});

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);



app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + customListName);
      }
    })


})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
  }

});



app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log('deleted!');
        res.redirect("/");
      })
      .catch((err) => {
        console.error(err);
        // Handle the error appropriately
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
        // Handle the error appropriately
      });

  }




});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});