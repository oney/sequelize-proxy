export declare type $GetType<T> = NonNullable<T> extends any[]
  ? NonNullable<T>
  : NonNullable<T> | null;
