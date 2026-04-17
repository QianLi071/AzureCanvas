# AzureCanvas
AzureCanvas is a modern, playful, exquisite idea sharing forum website, which is built with native CSS, HTML and Javascript.

## Features
**Implemented Features:**
- `Aero Effect`
- `Native CSS Scroll Animation`
- `JavaScript Animation`
- `Canvas Rendered Vision Effect`.


## APIs

| HTTP Method |                         Route |            Description |                                                                                     Request Body (Example) | Response Body (Example)                                                                                                                                                                                                                     |
|:-----------:|------------------------------:|-----------------------:|-----------------------------------------------------------------------------------------------------------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|    `GET`    |           /api/users/{userId} |              获取指定用户的信息 |                                                                                                        N/A | ````{ "userId": "uuid-string", "username": "john_doe", "email": "john.doe@example.com", "avatarUrl": "http://...", "bio": "I love my campus!", "joinedAt": "timestamp", "postsCount": 15, "followersCount": 100, "followingCount": 50 }```` |
|    `PUT`    |                 /api/users/me |            更新当前登录用户的信息 | ````{ "username": "new_username", "bio": "Updated bio.", "avatarUrl": "http://new-avatar.com" }```` (可选字段) | ````{ "userId": "uuid-string", "username": "new_username", "email": "john.doe@example.com", "avatarUrl": "http://new-avatar.com", "bio": "Updated bio.", "joinedAt": "timestamp", ... }````                                                 |
|    `GET`    |                 /api/users/me |            获取当前登录用户的信息 |                                                                                                        N/A | 	{ "userId": "uuid-string", "username": "john_doe", "email": "john.doe@example.com", "avatarUrl": "http://...", "bio": "I love my campus!", "joinedAt": "timestamp", ... }                                                                  |
|    `GET`    |           /api/users/me/posts | 获取当前登录用户发布的所有帖子（论坛、交易） |                                                           `?type=forum&page=1&limit=10` (可选参数，用于过滤帖子类型和分页) | [ { "postId": "uuid-string", "title": "My first post", "createdAt": "timestamp", "type": "forum" }, ... ]                                                                                                                                   |
|    `GET`    | /api/users/{userId}/followers |           获取指定用户的关注者列表 |                                                                                         `?page=1&limit=20` | [ { "userId": "uuid-string", "username": "follower1", "avatarUrl": "http://..." }, ... ]                                                                                                                                                    |
|    `GET`    | /api/users/{userId}/following |           获取指定用户关注的人列表 |                                                                                       ` ?page=1&limit=20 ` | [ { "userId": "uuid-string", "username": "following1", "avatarUrl": "http://..." }, ... ]                                                                                                                                                   |
|   `POST`    |  `/api/users/{userId}/follow` |                关注指定用户	 |                                                                                                        N/A | { "message": "Successfully followed user." }                                                                                                                                                                                                |
|  `DELETE`   |  `/api/users/{userId}/follow` |               取消关注指定用户 |                                                                                                        N/A | { "message": "Successfully unfollowed user." }                                                                                                                                                                                              |
## Getting Started
First, clone the project with git. Run following command in terminal:
```bash
git clone https://github.com/NeonAngelThreads/AzureCanvas.git
```
Directly open `index.html` inside the `\src\ ` folder.

## Community
- Encountered a bug? issues and suggestions are welcome!  
  My BiliBili space:
  https://m.bilibili.com/space/386644641
- If you like AzureCanvas, a **star** helps a lot!

## License
GPL-3.0 or later, see the [full LICENSE](LICENSE).

### **Built by NeonAngelThreads, Coding with ❤️**