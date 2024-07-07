//  Code below is taken from my Assingment 3 Solutions 

//importing module using required function
const express = require('express');
const { check, validationResult } = require('express-validator');
const path = require('path');
var myApp = express();

//Set up Database 
const mongoose=require('mongoose');

//Connect to Database
mongoose.connect('mongodb://localhost:27017/onlinestore');

//Create a model 
const Purchase=mongoose.model('purchases',{
    name: String,
    email: String,
    address: String,
    city: String,
    provinceName: String,
    phone: Number,
    jacketQuantity:Number,
    capQuantity:Number,
    glovesQuantity:Number,
    provinceTaxAmt:Number,
    totalAmt:Number
});

//Set parser to encode the form data
myApp.use(express.urlencoded({ extended: true }));

//Path for public and views folder
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

//Custom validation function define
//Regax pattern
var phoneReg = /^[0-9]{3}[0-9]{3}[0-9]{4}$/;
var emailReg = /^[a-z]*[@][a-z]*\.+[a-z]{2,3}$/i;
var positiveNum = /^[0-9][1-9]*$/;

//Regax check function
function checkReg(userInput, regex) {
    if (regex.test(userInput)) {
        return true;
    } else {
        return false;
    }
}
//Phone validation method
function customPhoneValidation(value) {
    if (!checkReg(value, phoneReg)) {
        throw new Error('Please enter valid phone number');
    }
    return true;
}
//Email validation method
function customEmailValidation(value) {
    if (!checkReg(value, emailReg)) {
        throw new Error('Please enter valid email address');
    }
    return true;
}
//Provience is positive or not validation method
function customProvinceValidation(province, { req }) {
    var province = req.body.province;
    console.log(province);
    if (!checkReg(province, positiveNum)) {
        throw new Error('Selected must be a positive number for provicence');
    } else {
        province = parseInt(province);
        if (province == -1) {
            throw new Error('Select the province');
        }
    }
    return true;
}
//Product worth be $10 or more check method
function validateMinimumPurchaseAmount(value, { req }) {
    let total = 0;
    //Products and price array
    var prodList = ['jacket', 'cap', 'gloves'];
    var prodPrice = [45, 9, 10];

    for (let i = 0; i < prodList.length; i++) {
        var qty = req.body[prodList[i]];
        if (qty != '' && qty > 0) {
            var price = prodPrice[i]
            total += price * qty;
        }
    }
    console.log("Total :" + total);
    //checking total is less than $10
    if (total < 10) {
        throw new Error('Minimum purchase should be $10.');
    }
    return true
}

//  Code below is taken from my Assingment 3 Solutions 

//load webpage for the first time
myApp.get('/', function (req, res) {
    res.render('form');
});

//Post method on submit form
myApp.post('/', [
    check('name', 'Name is required').notEmpty(),
    check('address', 'Address is required').notEmpty(),
    check('city', 'City is required').notEmpty(),
    check('province').custom(customProvinceValidation),
    check('email', '').custom(customEmailValidation),
    check('phone', '').custom(customPhoneValidation),
    check('.product').custom(validateMinimumPurchaseAmount)
], function (req, res) {

    var errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        //if any errors 
        res.render('form', { errors: errors.array() })
    } else {
        //No errors

        //Read the field
        var name = req.body.name;
        var email = req.body.email;
        var address = req.body.address;
        var city = req.body.city;
        var province = req.body.province;
        var phone = req.body.phone;

        var jacket = req.body.jacket;
        var cap = req.body.cap;
        var gloves = req.body.gloves;

        var prodList = ['jacket', 'cap', 'gloves'];
        var prodPrice = [45, 9, 10];
        var provinceList = { 1: 0.1, 2: 0.05, 3: 0.1, 4: 0.2, 5: 0.1, 6: 0.2, 7: 0.13, 8: 0.1, 9: 0.25, 10: 0.15 };// 1- Alberta, 2- British Columbia...
        var provinceNames = {
            1: 'Alberta', 2: 'British Columbia', 3: 'Manitoba', 4: 'New Brunswick', 5: 'Newfoundland & Labrador', 6: 'Nova Scotia', 
            7: 'Ontario', 8: 'Prince Edward Island', 9: 'Quebec', 10: 'Saskatchewan',
        }

        var productSelected = new Object();
        var subTotal = 0, total = 0, price = 0, prodName = '';
        var prodPriceList = [];

        for (let i = 0; i < prodList.length; i++) {
            var qty = req.body[prodList[i]];
            if (qty != '') {
                price = prodPrice[i];
                subTotal += price * qty;
                total += subTotal;
                prodName = prodList[i];
                var itemDetails = new Object();

                itemDetails.name = prodName;
                itemDetails.quntity = qty;
                itemDetails.price = price;
                itemDetails.subTotal = subTotal;

                prodPriceList.push(itemDetails);

                productSelected.prodPriceList = prodPriceList;
            }
        }

        var provinceTax = provinceList[province];
        var provinceTaxAmt = provinceTax * total;
        var grandTotal = total + provinceTaxAmt;

        productSelected.total = total;
        productSelected.grandTotal = grandTotal;
        var provinceName = provinceNames[province];

        var output = {
            name: name,
            email: email,
            address: address,
            city: city,
            provinceName: provinceName,
            phone: phone,
            jacketQuantity:req.body.jacket,
            capQuantity:req.body.cap,
            glovesQuantity:req.body.gloves,
            provinceTaxAmt:provinceTaxAmt.toFixed(2),
            totalAmt:grandTotal,
            productSelected: productSelected          
        };
        console.log(output);

        //Saving the data in database
        var order=new Purchase(output);

        order.save().then(function(){
            console.log('Data Saved successfully');
        }).catch(function(ex){
            console.log(`Database Error ${ex.toString()}`); // if any exception will show in terminal
        });

        res.render('form', output);
    }
});

//To get all purchases from the database
myApp.get('/showData',function(req,res){

    Purchase.find({}).then((purchases)=>{
        console.log(`purchases ${purchases}`);
        res.render('showData', {purchases});       
    }).catch(function(ex){
        console.log(`Database Error ${ex.toString()}`);
    });  

});

myApp.listen(8089);
console.log('Working fine.. open http://localhost:8089');
