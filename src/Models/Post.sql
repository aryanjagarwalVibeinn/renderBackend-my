

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY NOT NULL,           -- Unique identifier for each post
    media TEXT[] NOT NULL,                       -- Array of media URLs (e.g., images, videos)
    caption VARCHAR(255) NOT NULL,              -- Text caption associated with the post
    author VARCHAR(50) NOT NULL REFERENCES users(username), -- Username of the post author (foreign key to 'users')
    likes TEXT[],                                -- Array of usernames who liked the post
    comments JSON,                               -- JSON object for storing comments (username, text, likes, replies, etc.)
    visibility VARCHAR(50) NOT NULL DEFAULT 'friends', -- Post visibility: 'friends', 'everyone', or 'except_friends'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the post was created
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Timestamp when the post was last updated
    CONSTRAINT check_visibility CHECK (visibility IN ('friends', 'everyone', 'except_friends')) -- Ensures valid visibility values
);
