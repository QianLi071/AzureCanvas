-- 1. 为 users 表增加必要的索引（如果尚未存在）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. 重构 user_interest 表
-- 如果表已存在，先备份数据（可选）并删除
DROP TABLE IF EXISTS user_interest;

CREATE TABLE user_interest (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    interest VARCHAR(100) NOT NULL,
    CONSTRAINT fk_user_interest_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE,
    CONSTRAINT uk_user_interest UNIQUE (user_id, interest)
);

-- 为查询优化增加索引
CREATE INDEX idx_user_interest_user_id ON user_interest(user_id);
CREATE INDEX idx_user_interest_interest ON user_interest(interest);
