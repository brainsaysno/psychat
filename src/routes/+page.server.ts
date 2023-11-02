import { faker } from "@faker-js/faker";
import type { Actions } from "./$types"
import OpenAI from "openai";
import { fail } from "@sveltejs/kit";
import type { Message, Profile } from "$lib/types";
import { diagnoses } from "$lib/data";
import { getPromptForChat, getPromptForHistory } from "$lib/prompts";

const openai = new OpenAI();

export const actions = {
	sendMessage: async ({ request }) => {
		const data = await request.formData()

		const messagesString = data.get('messages');
		const profileString = data.get('profile');

		if (typeof messagesString != "string")
			return fail(400, {
				error: "Missing 'messages' property"
			})

		if (typeof profileString != "string")
			return fail(400, {
				error: "Missing 'profile' property"
			})

		const messages = JSON.parse(messagesString) as Message[];
		const profile = JSON.parse(profileString) as Profile;

		const completion = await openai.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: getPromptForChat(profile)
				},
				...messages
			],
			model: 'gpt-3.5-turbo',
		});

		return completion.choices[0].message;
	},
	newChat: async () => {
		const sex = faker.person.sex() as Profile['sex'];
		const profile: Profile = {
			name: `${faker.person.firstName(sex)} ${faker.person.lastName(sex)}`,
			sex,
			diagnosis: faker.helpers.arrayElement(diagnoses),
			summary: null,
			history: null
		}

		const completion = await openai.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: getPromptForHistory(profile)
				},
			],
			model: 'gpt-3.5-turbo',
		});

		const completionWithoutTags = (completion.choices[0].message.content || "").replace('--- START OF RESPONSE ---', '').replace('--- END OF RESPONSE ---', '');

		[profile.summary, profile.history] = completionWithoutTags.split('####') || [null, null];

		return profile;
	}
} satisfies Actions;
