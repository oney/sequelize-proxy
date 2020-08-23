# Sequelize proxy

This package add a proxy layer on Sequelize to optimize queries by gather multiple queries such as findByPk and get<Association> and merge them to one single query.
  
This package can easily and elegantly solve N+1 problem on GraphQL.

For example, we have GraphQL definition:

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
  posts(limit: Int): [Post]
}
```

and your reoslvers are
```typescript
import { createModels, Model } from 'src/packages/sequelize-proxy';
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
    posts(_, { limit }, { models }) {
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

When you use `findByPk_`, `$get_(association)`, it will use the proxy to query to have optimization.
