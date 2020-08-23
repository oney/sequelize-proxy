import { Sequelize } from 'sequelize';
import { Proxy } from './proxy';

export function injectProxy(sequelize: Sequelize) {
  for (const [name, model] of Object.entries(sequelize.models)) {
    // @ts-ignore
    model.proxy = new Proxy(model);
  }
}
