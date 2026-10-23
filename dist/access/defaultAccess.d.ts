import type { Access, CollectionConfig } from 'payload';
type CollectionAccess = NonNullable<CollectionConfig['access']>;
/**
 * Admins, or the user the document belongs to through `field`.
 */
export declare const isAdminOrOwner: (field: string) => Access;
/**
 * Access applied to plugin collections. Payload's own default lets any logged-in user create,
 * update and delete, so every operation is set. A consumer's `access` override is merged over
 * these, so overriding one operation keeps the others safe.
 */
export declare const defaultAccess: {
    addresses: {
        create: Access;
        delete: Access;
        read: Access;
        update: Access;
    };
    categories: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    certificates: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    courses: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    groups: {
        create: (args: import("payload").AccessArgs<import("payload").User>) => boolean;
        delete: (args: import("payload").AccessArgs<import("payload").User>) => boolean;
        read: Access;
        update: Access;
    };
    lessons: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    questions: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    quizzes: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    students: {
        create: Access;
        delete: (args: import("payload").AccessArgs<import("payload").User>) => boolean;
        read: Access;
        update: Access;
    };
    tags: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
    topics: {
        admin?: ({ req }: {
            req: import("payload").PayloadRequest;
        }) => boolean | Promise<boolean>;
        create?: Access;
        delete?: Access;
        read?: Access;
        readVersions?: Access;
        unlock?: Access;
        update?: Access;
    };
};
export declare const withDefaultAccess: (defaults: CollectionAccess, overrides: CollectionConfig["access"] | undefined) => CollectionAccess;
export {};
