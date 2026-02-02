const  supabase  = require("../config/supabase")

const uploadImageToSupabase = async (buffer, fileName, bucket = 'maiProject') => {

  console.log(fileName,'file form supa')
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`products/${fileName}`, buffer, {
      contentType: 'image/jpeg', // or dynamically set based on mimetype
      upsert: false,
    })

  if (error) {
    throw new Error('Supabase upload error: ' + error.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(`products/${fileName}`)

  return publicUrlData.publicUrl
}

module.exports = uploadImageToSupabase
