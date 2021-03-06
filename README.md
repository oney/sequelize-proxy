# Sequelize proxy

This package adds a proxy layer on Sequelize to optimize queries by gathering multiple queries such as findByPk and get[Association] (support hasOne, belongsTo, hasMany, belongsToMany) and merging them to one single query.
  
This package can easily and elegantly solve N+1 problem on GraphQL.

## Installation
```
npm install sequelize-proxy
```

## Example
For example, we have this GraphQL definition:

```graphql
type User {
  username: String
  posts(limit: Int) [Post]
}

type Post {
  title: String
  author: User
}

type Query {
  findPosts(limit: Int): [Post]
}
```

and the resolvers are
```typescript
import { createModels, Model } from 'sequelize-proxy';
import { BelongsTo, HasMany } from 'sequelize-typescript';
// This package requires you to use sequelize-typescript

const sequelize = new Sequelize(...);

export class User extends Model<User> {
  @HasMany(() => Post, 'authorId')
  posts: Post[];
}

export class Post extends Model<Post> {
  @BelongsTo(() => User, 'authorId')
  author: User;
}

const resolvers = {
  Query: {
    findPosts(_, { limit }, { models }) {
      return models.Post.findAll({ limit }};
    },
  },
  User: {
    posts(user, { limit }) {
      return user.$get_('posts', { limit }};
    },
  },
  Post: {
    author(post) {
      return post.$get_('author'};
      // or
      // return models.User.findByPk_(post.authorId};
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    models: createModels(sequelize)
  })
}));
```

When you use `findByPk_`, `$get_(association)`, it will use the proxy to query databases to have optimization.

Even you request a complex query like
```graphql
{
  findPosts(limit: 10) {
    title
    author {
      username
      posts(limit: 10) {
        title
        author {
          username
          posts(limit: 10) {
            title
            author {
              username
            }
          }
        }
      }
    }
  }
}
```
It only executes 6 SQL queries which are the same as 6 depth of GraphQL query.
```sql
Executing (default): SELECT * FROM posts LIMIT 10;

Executing (default): SELECT * FROM posts LEFT OUTER JOIN users ON posts.authorId = users.id WHERE `posts`.`id` IN (37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 56, 57, 58, 59, 60);

Executing (default): SELECT * FROM (SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 1 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 2 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 3 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 4 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 19 LIMIT 10) AS sub) AS `posts`;

Executing (default): SELECT * FROM posts LEFT OUTER JOIN users ON posts.authorId = users.id WHERE `posts`.`id` IN (38, 40, 39, 44, 59, 45, 43, 58);

Executing (default): SELECT * FROM (SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 1 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 2 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 3 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 4 LIMIT 10) AS sub UNION ALL SELECT * FROM (SELECT * FROM posts WHERE posts.authorId = 19 LIMIT 10) AS sub) AS `posts`;

Executing (default): SELECT * FROM posts LEFT OUTER JOIN users ON posts.authorId = users.id WHERE `posts`.`id` IN (38, 40, 39, 44, 59, 45, 43, 58);
```
