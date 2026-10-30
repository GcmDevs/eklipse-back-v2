export const EnumHumanMessage = <T>(
    field: string,
    allowed: number[],
    options: { value: number; option: string }[],
) =>
    `${field} debe ser uno de: ${options
        .filter(o => allowed.includes(o.value))
        .map(o => o.option)
        .join(', ')}`;
