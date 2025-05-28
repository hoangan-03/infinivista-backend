import {apiDocumentationKnowledge} from './api-documentation';
import {businessKnowledge} from './business';
import {featuresKnowledge} from './features';
import {privacySecurityKnowledge} from './privacy-security';
import {sampleContentKnowledge} from './sample-content';
import {technicalKnowledge} from './technical';
import {userGuideKnowledge} from './user-guide';

export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
}
export const allKnowledgeItems: KnowledgeItem[] = [
    ...userGuideKnowledge,
    ...featuresKnowledge,
    ...technicalKnowledge,
    ...privacySecurityKnowledge,
    ...apiDocumentationKnowledge,
    ...businessKnowledge,
    ...sampleContentKnowledge,
];

export {
    apiDocumentationKnowledge,
    businessKnowledge,
    featuresKnowledge,
    privacySecurityKnowledge,
    sampleContentKnowledge,
    technicalKnowledge,
    userGuideKnowledge,
};
