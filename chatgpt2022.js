const axios = require('axios');

module.exports = function (app) {
    async function chatgpt2022(question, { model = 'gpt-5', reasoning_effort = 'medium' } = {}) {
        try {
            const conf = {
                models: ['gpt-5', 'gpt-3.5'],
                reasoning: ['minimal', 'low', 'medium', 'high']
            };

            if (!question) throw new Error('Question is required');
            if (!conf.models.includes(model)) throw new Error(`Available models: ${conf.models.join(', ')}`);
            if (model === 'gpt-5' && !conf.reasoning.includes(reasoning_effort)) throw new Error(`Available reasoning effort: ${conf.reasoning.join(', ')}`);

            const { data } = await axios.post('https://chatgpt-2022.vercel.app/api/chat', {
                conversationId: Date.now().toString(),
                messages: [
                    {
                        role: 'user',
                        content: question
                    }
                ],
                ...(model === 'gpt-5' ? { reasoningEffort: reasoning_effort } : {}),
                model: model
            }, {
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                }
            });

            const parsed = data
                .split('\n\n')
                .filter(line => line)
                .map(line => JSON.parse(line.substring(6)));

            const reasoning = parsed.find(line => line.type === 'reasoning-done')?.text || '';
            const text = parsed
                .filter(line => line.type === 'text-delta')
                .map(line => line.textDelta)
                .join('') || '';

            return { reasoning, text };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // ✅ Endpoint Express
    app.get('/ai/chatgpt2022', async (req, res) => {
        try {
            const { text, model, reasoning_effort } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }

            const result = await chatgpt2022(text, { model, reasoning_effort });
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};