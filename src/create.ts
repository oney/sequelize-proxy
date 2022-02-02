import { Sequelize, ModelStatic, Model } from 'sequelize';
import { Proxy } from './proxy';

function proxyModel(model: ModelStatic<Model>) {
  class ProxyModel extends model {}
  Object.defineProperty(ProxyModel, 'name', { value: model.name });
  // @ts-ignore
  ProxyModel.proxy = new Proxy(ProxyModel);
  return ProxyModel;
}

export function createModels(
  sequelize: Sequelize,
): {
  [key: string]: ModelStatic<Model>;
} {
  const models: {
    [key: string]: ModelStatic<Model>;
  } = {};
  for (const [name, model] of Object.entries(sequelize.models)) {
    models[name] = proxyModel(model);
  }
  for (const [name, model] of Object.entries(models)) {
    for (const [asname, association] of Object.entries(model.associations)) {
      association.source = models[association.source.name];
      association.target = models[association.target.name];
    }
  }
  return models;
}
