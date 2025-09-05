'use server';

/**
 * @fileOverview An AI agent for generating marketing pages.
 *
 * - generateMarketingPage - A function that generates marketing pages based on input text and images.
 * - GenerateMarketingPageInput - The input type for the generateMarketingPage function.
 * - GenerateMarketingPageOutput - The return type for the generateMarketingPage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketingPageInputSchema = z.object({
  appName: z.string().describe('The name of the app.'),
  appDescription: z.string().describe('A detailed description of the app and its features.'),
  targetAudience: z.string().describe('The target audience for the app.'),
  heroImage: z
    .string()
    .describe(
      "A hero image for the app, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  exampleLayouts: z.array(z.string()).describe('Example layouts that might fit the app.'),
});

export type GenerateMarketingPageInput = z.infer<typeof GenerateMarketingPageInputSchema>;

const GenerateMarketingPageOutputSchema = z.object({
  marketingPageContent: z.string().describe('The generated HTML content for the marketing page.'),
  suggestedLayout: z.string().describe('The layout from exampleLayouts that best fits the app.'),
});

export type GenerateMarketingPageOutput = z.infer<typeof GenerateMarketingPageOutputSchema>;

export async function generateMarketingPage(
  input: GenerateMarketingPageInput
): Promise<GenerateMarketingPageOutput> {
  return generateMarketingPageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarketingPagePrompt',
  input: {schema: GenerateMarketingPageInputSchema},
  output: {schema: GenerateMarketingPageOutputSchema},
  prompt: `You are an expert marketer specializing in creating landing pages for new apps.

  Given the information about the app, generate a draft marketing page.

  App Name: {{appName}}
  Description: {{appDescription}}
  Target Audience: {{targetAudience}}
  Hero Image: {{media url=heroImage}}

  Consider these example layouts and suggest the best one:
  {{#each exampleLayouts}}
    - {{this}}
  {{/each}}

  The marketing page should be engaging, informative, and tailored to the target audience.
  Return the marketing page as HTML content and suggest the best layout.
  `,
});

const generateMarketingPageFlow = ai.defineFlow(
  {
    name: 'generateMarketingPageFlow',
    inputSchema: GenerateMarketingPageInputSchema,
    outputSchema: GenerateMarketingPageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
