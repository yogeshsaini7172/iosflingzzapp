-- Insert Keith's swipe on the current user to create a mutual match
INSERT INTO swipes (user_id, candidate_id, direction, created_at) 
VALUES ('4c91c220-763b-4217-b8db-0ec925e689b8', '11111111-1111-1111-1111-111111111001', 'right', NOW()) 
ON CONFLICT (user_id, candidate_id) DO NOTHING;

INSERT INTO enhanced_swipes (user_id, target_user_id, direction, created_at) 
VALUES ('4c91c220-763b-4217-b8db-0ec925e689b8', '11111111-1111-1111-1111-111111111001', 'right', NOW()) 
ON CONFLICT (user_id, target_user_id) DO NOTHING;