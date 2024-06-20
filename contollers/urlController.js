const Url = require('../models/urlSchema');
const User = require('../models/userSchema');


module.exports.url = async (req, res) => {
  const { _userId } = req.params;
  const { url } = req.body;
  try{
      const findUserExistinUrlCollection =await Url.findOne({_userId})
      if(findUserExistinUrlCollection){
          const addUrl =await Url.findOneAndUpdate({_id:findUserExistinUrlCollection._id},{$push:{url}})
          res.status(200).json({addUrl})
        }else{
            const createUrl =await Url.create({url,_userId})
            const updateUserCollection = await User.findByIdAndUpdate({_id:_userId},{urlId:createUrl._id})
          if(createUrl){
              res.json({ message: 'URL added successfully' });
            }
        }
  }
  catch(error){
    console.error("Error adding Url:", error)
    res.status(500).json({error});
  }
}

module.exports.getAllUserUrl = async (req,res)=>{
    const {_userId}=req.params;
    console.log(_userId)
    try {
        const userDetails = await User.findById({_id:_userId}).populate("urlId")
        res.status(200).json({userDetails})
    } catch (error) {
        console.log(error)
        res.status(400).json({error})
    }
}
