
import { useMemo, useRef, useState } from "react";
import "minimal-polyfills/Object.fromEntries";
import type { Theme } from "@material-ui/core/styles";
import type {
    Interpolation,
    InterpolationWithTheme as InterpolationWithThemeGeneric
} from "@emotion/core";
import { useTheme } from "@material-ui/core/styles";
import { assert } from "evt/tools/typeSafety/assert";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
import { useMemoizedRecord } from "app/utils/hooks/useMemoizedRecord";
/** must be imported everywhere we use the css property!
 * 
 * Add the comments:
 * 
 * /** @jsxRuntime classic *\/
 * /** @jsx jsx *\/
 * 
 * See: https://github.com/mui-org/material-ui/issues/22342
 * And: https://github.com/mui-org/material-ui/issues/22342#issuecomment-763969182 (not implemented)
 */
export { jsx } from "@emotion/react";

//NOTE: For future version of @material-ui, when @emotion/core will be removed.
//import type { Interpolation as InterpolationNext } from "@emotion/serialize";

export type InterpolationWithTheme = InterpolationWithThemeGeneric<Theme>

/** 
 * 
 * Implementation of JSS createStyles() based on @emotion/react
 * 
 * /** @jsxRuntime classic *\/
 * /** @jsx jsx *\/
 * import { jsx, createUseCssRecord } from "app/theme/useCssRecord";
 * 
 * const { useCssRecord } = createUseCssRecord<Props & { color: "red" | "blue" }>()({
 *    ({ theme }, { color })=> ({
 *        "root": { color }
 *    })
 * });
 * 
 * 
 * function MyComponent(props: Props){
 * 
 *     const [ color, setColor ]= useState<"red" | "blue">("red");
 * 
 *     const { cssRecord }=useCssRecord({...props, color });
 * 
 *     return <span css={cssRecord.root}>hello world</span>;
 * 
 * }
 * 
 */
export function createUseCssRecord<Params extends Record<string, unknown>>() {

    return function <Key extends string>(
        getCssRecord: (themeWrap: { theme: Theme; }, params: Params) => Record<Key, Interpolation>
    ) {

        const getCssRecordAndAccessedParamsKeys = (theme: Theme, params: Params) => {

            const accessedParamsKeys: Key[] = [];

            const cssRecord = getCssRecord(
                { theme },
                new Proxy(
                    params,
                    {
                        "get": (...args) => {

                            const [, prop] = args;

                            assert(
                                typeof prop === "string" &&
                                typeGuard<Key>(prop)
                            );

                            accessedParamsKeys.push(prop);

                            return Reflect.get(...args);

                        }
                    }
                )
            );

            return { cssRecord, accessedParamsKeys };


        };

        function useCssRecord(params: Params) {

            const theme = useTheme();



            const accessedParamsKeysRef = useRef(
                useState(() =>
                    getCssRecordAndAccessedParamsKeys(theme, params)
                        .accessedParamsKeys
                )[0]
            );

            return useMemo(
                () => {

                    const { cssRecord, accessedParamsKeys } =
                        getCssRecordAndAccessedParamsKeys(theme, params);

                    accessedParamsKeysRef.current = accessedParamsKeys;

                    return { cssRecord };

                },
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [theme, useMemoizedRecord(
                    Object.fromEntries(
                        accessedParamsKeysRef.current.map(
                            key => [key, params[key]]
                        )
                    )
                )]
            );

        }

        return { useCssRecord };

    }

}


/*
export function createUseCssRecord<Params extends Record<string, unknown>>() {

    return function <Key extends string>(
        getCssRecord: (themeWrap: { theme: Theme; }, params: Params) => Record<Key, Interpolation>
    ) {

        function useCssRecord(params: Params) {

            const theme = useTheme();

            const [{  getParamsDependencyArray }] = useState(() => {

                const keys: Key[] = [];

                getCssRecord(
                    { theme },
                    new Proxy(
                        params,
                        {
                            "get": (...args) => {

                                const [, prop] = args;

                                assert(
                                    typeof prop === "string" && 
                                    typeGuard<Key>(prop)
                                );

                                keys.push(prop);

                                return Reflect.get(...args);

                            }
                        }
                    )
                );

                function getParamsDependencyArray(record: Params){
                    return keys.map(key=> record[key]);
                }

                return { getParamsDependencyArray };

            });

            const cssRecord = useMemo(
                () => getCssRecord({ theme }, params),
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [theme, ...getParamsDependencyArray(params)]
            );

            return { cssRecord };

        }

        return { useCssRecord };

    }

}
*/



export { useTheme };


