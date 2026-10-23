import type { TextFieldClientProps } from 'payload';
import React from 'react';
import './index.scss';
type SlugComponentProps = {
    checkboxFieldPath: string;
    fieldToUse: string;
} & TextFieldClientProps;
export declare const SlugInput: React.FC<SlugComponentProps>;
export {};
