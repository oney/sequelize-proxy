import { FindAttributeOptions, FindOptions } from 'sequelize';
import { AssociationGetOptions } from 'sequelize-typescript/dist/model/model/association/association-get-options';

export function collectAttributes(options: (FindOptions | undefined)[]): FindAttributeOptions | undefined {
  if (options.some((option) => !option || !option.attributes)) {
    return undefined;
  }
  const set = new Set<string>();
  set.add('id');
  options.forEach((option) => {
    if (option && Array.isArray(option.attributes)) {
      option.attributes.forEach((attr) => {
        set.add(attr as string);
      });
    }
  });
  return Array.from(set);
}

export function stringify(options?: AssociationGetOptions) {
  if (!options) return JSON.stringify(null);
  return JSON.stringify(options);
}
