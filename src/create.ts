import { Sequelize, ModelType, ModelCtor, Model } from 'sequelize';
import { Proxy } from './proxy';

function proxyModel(model: ModelType) {
  class ProxyModel extends model {}
  Object.defineProperty(ProxyModel, 'name', { value: model.name });
  // @ts-ignore
  ProxyModel.proxy = new Proxy(ProxyModel);
  return ProxyModel;
}

export function createModels(
  sequelize: Sequelize,
): {
  [key: string]: ModelCtor<Model>;
} {
  const models: {
    [key: string]: ModelCtor<Model>;
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
