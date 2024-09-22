var applyOperations = function(nums) {
    // let newNum = [];
    for(let i = 0; i < nums.length; i++){
        if(nums[i] == nums[i+1]){
            nums[i] = nums[i]*2;
            nums[i+1] = 0;
        }
    }
    let arr = [];
    let zero = [];
    for(let j = 0; j < nums.length; j++){
        if(nums[j] !== 0 ){
            arr.push(nums[j])
        }else{
            zero.push(nums[j])
        }
    }
    
    return [...arr,...zero];

};

let c = applyOperations([1,2,2,1,1,0])

console.log(c)