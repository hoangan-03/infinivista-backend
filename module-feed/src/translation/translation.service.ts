import {HarmBlockThreshold, HarmCategory, VertexAI} from '@google-cloud/vertexai';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';

import {TranslateContentDto} from './translation.dto';

@Injectable()
export class TranslationService {
    private readonly logger = new Logger(TranslationService.name);
    private vertexAI: VertexAI;
    private generativeModel: any;
    private readonly geminiModelName: string;

    constructor(private configService: ConfigService) {
        this.geminiModelName = this.configService.getOrThrow<string>('VERTEX_AI_GEMINI_MODEL_NAME');

        this.vertexAI = new VertexAI({
            project: this.configService.getOrThrow<string>('GCP_PROJECT_ID'),
            location: this.configService.getOrThrow<string>('GCP_REGION'),
        });

        this.initializeModels();
    }

    private initializeModels(): void {
        try {
            this.logger.log(`Initializing Gemini model: ${this.geminiModelName}`);
            this.generativeModel = this.vertexAI.getGenerativeModel({
                model: this.geminiModelName,
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                ],
            });
            this.logger.log(`Successfully initialized Vertex AI models with Gemini: ${this.geminiModelName}`);
        } catch (error) {
            this.logger.error('Failed to initialize Vertex AI models:', error);
            throw new Error('Failed to initialize Translation service models');
        }
    }

    async translate(translateContentDto: TranslateContentDto): Promise<string> {
        const {content, targetLanguage} = translateContentDto;
        this.logger.log(`Translating content to ${targetLanguage}: "${content.substring(0, 50)}..."`);

        const languageName = this.getLanguageName(targetLanguage);
        const languageCode = this.getLanguageCode(targetLanguage);

        const prompt = this.createNaturalTranslationPrompt(content, languageName, languageCode);

        try {
            const result = await this.generativeModel.generateContent({
                contents: [{role: 'user', parts: [{text: prompt}]}],
            });

            const response = result.response;
            let translatedText = response?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!translatedText) {
                this.logger.error('No translated text received from Gemini API');
                throw new Error('Failed to translate content. No response from API.');
            }

            // Clean up the response to extract pure translation
            translatedText = this.cleanTranslationResponse(translatedText as string);

            this.logger.log(`Successfully translated content: "${translatedText}"`);
            return translatedText;
        } catch (error: any) {
            this.logger.error('Error translating content with Gemini API:', error);
            throw new Error(`Failed to translate content: ${error.message}`);
        }
    }

    private cleanTranslationResponse(rawResponse: string): string {
        let cleaned = rawResponse.trim();

        // Remove surrounding quotes if present
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1);
        }

        // Remove common prefixes that indicate explanations
        const prefixPatterns = [
            /^Translation:\s*/i,
            /^Vietnamese:\s*/i,
            /^Spanish:\s*/i,
            /^French:\s*/i,
            /^German:\s*/i,
            /^Italian:\s*/i,
            /^Portuguese:\s*/i,
            /^Russian:\s*/i,
            /^Chinese:\s*/i,
            /^Japanese:\s*/i,
            /^Korean:\s*/i,
            /^Arabic:\s*/i,
            /^Hindi:\s*/i,
            /^Thai:\s*/i,
            /^Here is the translation:\s*/i,
            /^The translation is:\s*/i,
        ];

        for (const pattern of prefixPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        const lines = cleaned
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length === 1) {
            return lines[0];
        }

        // Enhanced explanation word detection
        const explanationWords = [
            'translation',
            'translate',
            'means',
            'this',
            'says',
            'in',
            'language',
            'here',
            'the',
            'is',
            'would',
            'be',
            'note',
            'explanation',
            'literally',
            'roughly',
            'alternatively',
            'option',
            'choice',
            'multiple',
            'pronoun',
            'formal',
            'informal',
            'polite',
            'casual',
        ];

        // Find the line that's most likely the actual translation
        let bestTranslation = lines[0];
        let minExplanationWords = Number.MAX_SAFE_INTEGER;

        for (const line of lines) {
            // Skip lines that look like explanations or alternatives
            if (line.includes('/') && line.split('/').length > 2) {
                continue; // Skip lines with multiple slashes (like pronoun options)
            }

            const explanationWordCount = explanationWords.filter((word) =>
                line.toLowerCase().includes(word.toLowerCase())
            ).length;

            // Prefer shorter lines with fewer explanation words
            if (
                explanationWordCount < minExplanationWords ||
                (explanationWordCount === minExplanationWords && line.length < bestTranslation.length)
            ) {
                bestTranslation = line;
                minExplanationWords = explanationWordCount;
            }
        }

        return bestTranslation;
    }

    private getLanguageName(languageEnum: string): string {
        const languageMap: Record<string, string> = {
            ENGLISH: 'English',
            VIETNAMESE: 'Vietnamese',
            SPANISH: 'Spanish',
            FRENCH: 'French',
            GERMAN: 'German',
            ITALIAN: 'Italian',
            PORTUGUESE: 'Portuguese',
            RUSSIAN: 'Russian',
            CHINESE: 'Chinese',
            JAPANESE: 'Japanese',
            KOREAN: 'Korean',
            ARABIC: 'Arabic',
            HINDI: 'Hindi',
            THAI: 'Thai',
        };

        return languageMap[languageEnum] || languageEnum.toLowerCase();
    }

    private createNaturalTranslationPrompt(content: string, languageName: string, languageCode: string): string {
        // Check if content is a greeting or common phrase for natural enhancement
        const isGreeting = this.isGreeting(content);
        const isFormal = this.isFormalContent(content);

        let prompt = `Translate the following text to natural ${languageName}. `;

        // Add context-specific instructions
        if (isGreeting) {
            prompt += `Use natural greetings as a native speaker would. `;
        }

        // Add language-specific cultural context with specific instructions
        const specificInstructions = this.getLanguageSpecificInstructions(languageCode);
        if (specificInstructions) {
            prompt += specificInstructions;
        }

        if (isFormal) {
            prompt += `Keep it professional and respectful. `;
        } else {
            prompt += `Use a casual, friendly tone. `;
        }

        prompt += `Make it sound completely natural as if written by a native speaker. `;
        prompt += `Do not add explanations, alternatives, or multiple options. `;
        prompt += `Provide only ONE clean, natural translation:\n\n${content}`;

        return prompt;
    }

    private isGreeting(content: string): boolean {
        const greetingPatterns = [
            /^hello/i,
            /^hi\b/i,
            /^hey/i,
            /^good morning/i,
            /^good afternoon/i,
            /^good evening/i,
            /^goodbye/i,
            /^bye/i,
            /^see you/i,
            /^welcome/i,
            /^how are you/i,
            /^nice to meet/i,
        ];

        return greetingPatterns.some((pattern) => pattern.test(content.trim()));
    }

    private isFormalContent(content: string): boolean {
        const formalIndicators = [
            /\b(sir|madam|mr\.|mrs\.|ms\.|dr\.)/i,
            /\b(please|thank you|sincerely|regards|respectfully)/i,
            /\b(meeting|appointment|business|professional|company)/i,
            /\b(would you|could you|may i|i would like to)/i,
        ];

        return formalIndicators.some((pattern) => pattern.test(content));
    }

    private getLanguageSpecificInstructions(languageCode: string): string {
        const instructions: Record<string, string> = {
            vi: 'Use "mình" for casual first person and choose appropriate pronouns naturally. Avoid listing multiple pronoun options. ',
            es: 'Use natural Spanish with appropriate formality (tú/usted). ',
            fr: 'Use natural French with appropriate formality (tu/vous). ',
            de: 'Use natural German with appropriate formality (du/Sie). ',
            it: 'Use natural Italian expressions. ',
            pt: 'Use natural Portuguese with appropriate formality. ',
            ru: 'Use natural Russian expressions. ',
            zh: 'Use natural Chinese expressions. ',
            ja: 'Use appropriate Japanese politeness levels naturally. ',
            ko: 'Use natural Korean with appropriate honorifics. ',
            ar: 'Use natural Arabic expressions. ',
            hi: 'Use natural Hindi expressions. ',
            th: 'Use natural Thai expressions. ',
        };

        return instructions[languageCode] || '';
    }

    private getLanguageCode(languageEnum: string): string {
        const codeMap: Record<string, string> = {
            ENGLISH: 'en',
            VIETNAMESE: 'vi',
            SPANISH: 'es',
            FRENCH: 'fr',
            GERMAN: 'de',
            ITALIAN: 'it',
            PORTUGUESE: 'pt',
            RUSSIAN: 'ru',
            CHINESE: 'zh',
            JAPANESE: 'ja',
            KOREAN: 'ko',
            ARABIC: 'ar',
            HINDI: 'hi',
            THAI: 'th',
        };

        return codeMap[languageEnum] || 'en';
    }
}
