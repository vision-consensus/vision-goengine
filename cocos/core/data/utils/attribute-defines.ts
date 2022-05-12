

type GroupOptions = { name: string; } & Partial<{
    id: string;
    name: string;
    displayOrder: number;
    style: string;
}>;

export interface IExposedAttributes {
    /**
     * 指定属性的类型。
     */
    type?: any;

    /**
     * 控制是否在编辑器中显示该属性。
     */
    visible?: boolean | (() => boolean);

    /**
     * 该属性在编辑器中的显示名称。
     */
    displayName?: string;

    /**
     *
     */
    displayOrder?: number;

    /**
     * @en Editor tooltip of this property.
     * @zh 该属性在编辑器中的工具提示内容。
     */
    tooltip?: string;

    /**
     * @en The group name where this property is organized into, on property inspector.
     * @zh 在属性检查器上该属性所属的分类标签名。
     */
    group?: string | GroupOptions;

    /**
     *
     */
    multiline?: boolean;

    /**
     * 指定该属性是否为可读的。
     * 将 `readonly` 指定为 `true` 或选项对象时都将标记为该属性是可读的；
     * 当指定为 `true` 时将应用所有默认的只读性质。
     * @default false
     */
    readonly?: boolean | {
        /**
         * 如果该属性是对象或数组，指定该对象的属性或该数组的元素是否是只读的。
         * 若为 `true`，递归的所有属性或元素都将是只读的。
         * @default true
         */
        deep?: boolean;
    };

    /**
     * 当该属性为数值类型时，指定了该属性允许的最小值。
     */
    min?: number;

    /**
     * 当该属性为数值类型时，指定了该属性允许的最大值。
     */
    max?: number;

    /**
     * 当该属性为数值类型时并在编辑器中提供了滑动条时，指定了滑动条的步长。
     */
    step?: number;

    /**
     * 当该属性为数值类型时，指定了该属性允许的范围。
     */
    range?: number[];

    /**
     * 当该属性为数值类型时，是否在编辑器中提供滑动条来调节值。
     */
    slide?: boolean;

    /**
     * 该属性是否参与序列化和反序列化。
     */
    serializable?: boolean;

    /**
     * 该属性的曾用名。
     */
    formerlySerializedAs?: string;

    /**
     * 该属性是否仅仅在编辑器环境中生效。
     */
    editorOnly?: boolean;

    /**
     * 是否覆盖基类中的同名属性。
     */
    override?: boolean;

    /**
     *
     */
    animatable?: boolean;

    /**
     *
     */
    unit?: string;

    /**
     * 转换为弧度
     */
    radian?: boolean;
}

export interface IAcceptableAttributes extends IExposedAttributes {
    _short?: boolean;
}
