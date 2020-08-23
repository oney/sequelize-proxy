import * as DataLoader from 'dataloader';
import { FindOptions, Identifier, ModelCtor } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { AssociationGetOptions } from 'sequelize-typescript/dist/model/model/association/association-get-options';
import { $GetType } from './types';
import { collectAttributes, stringify } from './utils';

export class Proxy {
  constructor(public model: ModelCtor<Model>) {}

  private findByPkDataLoader = new DataLoader(
    // @ts-ignore
    async (keys: { id?: Identifier; options?: Omit<FindOptions, 'where'> }[]): Promise<(Model | undefined)[]> => {
      const attributes = collectAttributes(keys.map((k) => k.options));
      const instances = await this.model.findAll({
        attributes,
        where: {
          // @ts-ignore
          id: Array.from(new Set(keys.map((k) => k.id).filter((i) => !!i))),
        },
      });
      const map = new Map<number, Model>();
      instances.forEach((instance) => {
        // @ts-ignore
        map.set(instance.id, instance);
      });
      return keys.map((k) => map.get(k.id as number));
    },
  );
  findByPk<M extends Model>(id?: Identifier, options?: Omit<FindOptions, 'where'>): Promise<M | null> {
    // @ts-ignore
    return this.findByPkDataLoader.load({ id, options });
  }

  private $getDataLoader = new DataLoader(
    // @ts-ignore
    async (
      keys: {
        id: Identifier;
        prop: string;
        options?: AssociationGetOptions;
      }[],
    ): Promise<(Model | null | Model[])[]> => {
      const map = new Map<string, Map<string, Set<Identifier>>>();
      keys.forEach(({ id, prop, options }) => {
        if (!map.has(prop)) map.set(prop, new Map<string, Set<Identifier>>());
        const propMap = map.get(prop)!;
        const opKey = stringify(options);
        if (!propMap.has(opKey)) propMap.set(opKey, new Set<Identifier>());
        const ids = propMap.get(opKey)!;
        ids.add(id);
      });
      const returnMap = new Map<string, Map<string, Map<Identifier, Model>>>();
      const promises: Promise<void>[] = [];
      map.forEach((propMap, prop) => {
        propMap.forEach((ids, opKey) => {
          const options = JSON.parse(opKey);

          promises.push(
            this.model
              .findAll({
                attributes: ['id'],
                where: {
                  id: Array.from(ids),
                },
                include: [{ ...options, association: prop }],
              })
              .then((instances) => {
                if (!returnMap.has(prop)) returnMap.set(prop, new Map<string, Map<Identifier, Model>>());
                const propMap = returnMap.get(prop)!;

                if (!propMap.has(opKey)) propMap.set(opKey, new Map<Identifier, Model>());
                const insMap = propMap.get(opKey)!;
                instances.forEach((instance) => {
                  // @ts-ignore
                  insMap.set(instance.id, (instance as any)[prop]);
                });
              }),
          );
        });
      });
      await Promise.all(promises);

      return keys.map(({ id, prop, options }) => {
        const notfound = this.model.associations[prop].isSingleAssociation ? null : [];
        const propMap = returnMap.get(prop);
        if (!propMap) return notfound;
        const opKey = stringify(options);
        const insMap = propMap.get(opKey);
        if (!insMap) return notfound;
        return insMap.get(id) as Model;
      });
    },
  );

  $get(id: Identifier, prop: string, options?: AssociationGetOptions): Promise<$GetType<any>> {
    // @ts-ignore
    return this.$getDataLoader.load({ id, prop, options });
  }
}
