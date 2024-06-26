// const generateOTP = async()=>{
//     return Math.random().toString().slice(2,8);
// }
//     console.log(generateOTP());
// const bcrypt = require('bcrypt');

// const obj = {
//     username:'vishal',
//     useremail:'vishal123@gmail.com',
//     mobilenumber:'12345',
//     password:'asdfgh'
// }

// console.log(obj.name);
// let a = 6;

// if(a){
//     console.log('a is not empty');
// }
// else{
//     console.log('a is empty');
// }

// const { username, useremail, mobilenumber, password} = obj
// const secretpassword = bcrypt.hash(password, 10);


// const user = {
// username,
// useremail,
// mobilenumber,
// password
// secretpassword 
// }
// console.log(user);

// function sayHi() {
// console.log("Hello!");
// }

// This will print "Hello!" after 2 seconds
// const timerId = setTimeout(sayHi, 2000);

// This cancels the timeout if it hasn't fired yet
//   clearTimeout(timerId);

//   sayHi()

// const users = [
//   { name: 'Alice', age: 30 },
//   { name: 'Bob', age: 25 },
//   { name: 'Charlie', age: 40 }
// ];

// const obj = users.find(user => user.name === 'Alice');
// console.log(obj);


// const otpExpiryTime = () => {
//   const now = new Date();
//   now.setMinutes(now.getMinutes()+1);
//   return now;
// };

// console.log(otpExpiryTime());

// const previous = new Date();

// previous.setMinutes(previous.getMinutes()+1);

// console.log(previous.toString());

// const now = new Date();
// now.setHours(now.getHours()+1);

// console.log(now.toString())

// if(previous.getHours()>now.getHours()){
//     console.log(true);
// }
// else if(previous.getHours() == now.getHours()){
//       if(previous.getMinutes() > now.getMinutes()){
//             console.log(true);
//       }else{
//         console.log(false);
//       }
// }


// for(var i = 1;i<5;i++){
//   setTimeout(()=>{
//     console.log(i);
//   },i*1000)
// }
// for(let i = 0,j = 10;j>=0;i++,j--){
//   setTimeout(()=>{
//     console.log(i,j);
//   },i*1000)
// }

//  var i = 5;
//  var i = 4;
// console.log(i);

// for(let j = 1; j<5;j++){
//  setTimeout( function(){
//     console.log(j);
//   },0)
//   }

// console.log(1);
// let company = 'tvs';

// let person = { name: 'Alice',
//                age: 30 }

// // person['place'] = 'kaniyaram';
// // person.place = 'kochi';
// person = {company}

// console.log(person);


// const summer = new Date('2024-06-07T14:18:09.289Z');
// const winter = new Date('2024-06-07T14:18:10.301Z');

// const obj = { name: 'Alice', age: 30 };

// const{age} = obj;
// console.log(age);

// obj.sum = summer;
// obj['win'] = winter;

// console.log(obj)

// if(summer<winter){
//   console.log(true);
// }else{
//   console.log(false);
// }
// // console.log(summer);

// let b = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
// const{xs,s,m,l,xl,xxl} = sizes;

// for( const key in sizes){
//   // console.log(key);
//   // console.log( key +"values are "+sizes[key])
//    c.push(key);
//    d.push(sizes[key]);
// }



// let sizes = {
//   xs: '5',
//   s: '5',
//   m: '5',
//   l: '5',
//   xl: '5',
//   xxl: '5'
// }

// function obj(size,quantity){
//   this.size = size;
//   this.quantity = quantity
// }

// let allsizes = []
// for(const key in sizes){
//     allsizes.push(new obj(key,sizes[key]));
// }
// console.log(allsizes)

// let sizes=[
//      { size: 'XS', quantity: '1' },
//      { size: 'S', quantity: '2' },
//      { size: 'M', quantity: '3' },
//      { size: 'L', quantity: '4' },
//      { size: 'XL', quantity: '5' },
//      { size: 'XXL', quantity: '6' }
// ]


// sizes.forEach((obj) =>{
//         // console.log(Object.keys(obj))

//       })


// <td>
//                                             <% for (let j=0; j < allProducts[i].sizes.length; j++) { %>
//                                                 <div><%= allProducts.sizes[j].size %> - <%= allProducts[i].sizes[j].quantity %></div>
//                                             <% } %>
//                                         </td>


// const x = 6;
// console.log(x.toString(2));

// var countBits = function(n) {
//     // let c = 0;
//     let arr = [];
//     for(let i = 0; i<=n; i++){
//       c = i.toString(2)
      
//       arr.push(c);
//     }
//     return arr;
// };

// console.log(countBits(2));

// let i = 0;
// const b = i.toString(2).split('');
// let c = [];

// b.forEach((x)=>{
//     c.push(parseInt(x));
// })

// let ans = c.reduce((a,b) => {
//     return a+b;
// })
// console.log(ans);

// console.log(10%2)


// let arr = [];


// for(let i = 0; i<=5 ; i++){
//     let c = 0;
//     let d = [];
//     let ans = 0;
//     c = i.toString(2).toString().split('');

//     c.forEach(element => {
//        d.push(parseInt(element));
//     });
//     ans = d.reduce((a,b) => {
//         return a+b;
//     })
//     arr.push(ans);
// }

// console.log(arr);

// let item = [[1,2,3],[4,5,6],[7,8,9]];

// for(let i = 0; i<item.length; i++){
    
//     console.log(item[i]);
    
//     for(let j = 0; j<item[i].length; j++){
//         console.log(item[i][j]);
//     }
// }

// var strStr = function(haystack, needle) {
//     return haystack.indexOf(needle);
// };

// console.log(strStr('leetcode','code'));

let arr = [];

let nums = [1,2,2,4];

// for(let i = 0; i<nums.length; i++){
//     for(let j =i+1; j<nums.length; j++){
//         if(nums[i] === nums[j]){
//             arr.push(nums[j]);
//         }
//     }
// }

// for(let k = 1; k<=nums.length; k++){
//     if(k != nums[k-1]){
//         arr.push(k)
//     }
// }

// console.log(arr);

// let ans= nums.reduce((a,b) => {
//         if(a ){
//             a = b;
//         }
//         return a;
// });

// console.log(ans);

var removeTrailingZeros = function(num) {
  
    let number = num.split('');
    console.log(number);
    for(let i = num.length-1; i>=0; i--){
        // console.log(number[i]);
        if(number[i] === '0' ){    
          number.pop();
    }
    else{
        break;
    }
    }
     return number.join('');
};

console.log(removeTrailingZeros("51230100"))