import React from 'react';
import { TextFieldClientProps } from 'payload';
import './index.scss';
type SlugComponentProps = {
    fieldToUse: string;
    checkboxFieldPath: string;
} & TextFieldClientProps;
export declare const SlugInput: React.FC<SlugComponentProps>;
export {};
