export type Message = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type Profile = {
	name: string;
	sex: "male" | "female";
	diagnosis: string;
	summary: string | null;
	history: string | null;
};

export type Chat = {
	profile: Profile;
	messages: Array<Message>;
};
