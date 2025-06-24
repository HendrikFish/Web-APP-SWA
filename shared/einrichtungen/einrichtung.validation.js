const z = require('zod');

const einrichtungSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(3, { message: "Der Name muss mindestens 3 Zeichen lang sein." }),
    kuerzel: z.string().min(1, { message: "Ein Kürzel ist erforderlich." }).max(10, { message: "Das Kürzel darf maximal 10 Zeichen lang sein." }),
    adresse: z.string().min(5, { message: "Die Adresse muss mindestens 5 Zeichen lang sein." }),
    ansprechperson: z.string().optional(),
    telefon: z.string().optional(),
    email: z.string().email({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." }).optional().or(z.literal('')),
    isIntern: z.boolean(),
    personengruppe: z.string(),
    tour: z.string(),
    speiseplan: z.record(z.object({
        suppe: z.boolean(),
        hauptspeise: z.boolean(),
        dessert: z.boolean()
    })),
    gruppen: z.array(z.object({
        name: z.string().min(1),
        anzahl: z.number().int().positive()
    }))
});

module.exports = { einrichtungSchema }; 