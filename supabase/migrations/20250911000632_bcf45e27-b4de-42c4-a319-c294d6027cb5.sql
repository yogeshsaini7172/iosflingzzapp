-- Sync QCS scores from qcs table to profiles table
UPDATE profiles 
SET total_qcs = qcs.total_score
FROM qcs 
WHERE profiles.firebase_uid = qcs.user_id 
   OR profiles.user_id = qcs.user_id;