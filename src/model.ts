import { FindOptions, Identifier, NonNullFindOptions } from 'sequelize';
import { AssociationGetOptions } from 'sequelize-typescript/dist/model/model/association/association-get-options';
import { Model as OrginalModel } from 'sequelize-typescript';
import { Proxy } from './proxy';
import { $GetType } from './types';

export class Model<T = any, T2 = any> extends OrginalModel<T, T2> {
  static proxy: Proxy;

  public static findByPk_<M extends Model>(
    this: { new (): M } & typeof Model,
    identifier?: Identifier,
    options?: Omit<FindOptions, 'where'>,
  ): Promise<M | null>;
  public static findByPk_<M extends Model>(
    this: { new (): M } & typeof Model,
    identifier: Identifier,
    options: Omit<NonNullFindOptions, 'where'>,
  ): Promise<M>;

  public static findByPk_<M extends Model>(
    this: { new (): M } & typeof Model,
    identifier?: Identifier,
    options?: Omit<FindOptions, 'where'> | Omit<NonNullFindOptions, 'where'>,
  ): Promise<M | null> {
    return this.proxy.findByPk(identifier, options);
  }

  $get_<K extends keyof this>(propertyKey: K, options?: AssociationGetOptions): Promise<$GetType<this[K]>> {
    return ((this.constructor as any).proxy as Proxy).$get(this.id, propertyKey as string, options);
  }
}
