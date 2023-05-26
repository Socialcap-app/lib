import { randomInt, randomUUID } from "crypto";
import { fastify, prisma } from "~/global";
import { i18n as _ } from "~/i18n/messages";
import { Errors } from "~/routes/errors";
import { formatMutationResult } from "~/routes/results";
import { PersonState } from "~/models/person-helpers";


// taken from https://www.dicebear.com/styles/fun-emoji
const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none' shape-rendering='auto'%3E%3Cdesc%3E'Fun Emoji Set' by 'Davis Uche', licensed under 'CC BY 4.0'. / Remix of the original. - Created with dicebear.com%3C/desc%3E%3Cmetadata xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:cc='http://creativecommons.org/ns%23' xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns%23'%3E%3Crdf:RDF%3E%3Ccc:Work%3E%3Cdc:title%3EFun Emoji Set%3C/dc:title%3E%3Cdc:creator%3E%3Ccc:Agent rdf:about='https://www.instagram.com/davedirect3/'%3E%3Cdc:title%3EDavis Uche%3C/dc:title%3E%3C/cc:Agent%3E%3C/dc:creator%3E%3Cdc:source%3Ehttps://www.figma.com/community/file/968125295144990435%3C/dc:source%3E%3Ccc:license rdf:resource='https://creativecommons.org/licenses/by/4.0/' /%3E%3C/cc:Work%3E%3C/rdf:RDF%3E%3C/metadata%3E%3Cmask id='viewboxMask'%3E%3Crect width='200' height='200' rx='0' ry='0' x='0' y='0' fill='%23fff' /%3E%3C/mask%3E%3Cg mask='url(%23viewboxMask)'%3E%3Crect fill='%23d9915b' width='200' height='200' x='0' y='0' /%3E%3Cg transform='matrix(1.5625 0 0 1.5625 37.5 110.94)'%3E%3Cpath d='M75.08 12a1.37 1.37 0 0 1 1.26.83 15.26 15.26 0 0 1-15.67 22.03 15.2 15.2 0 0 1-9.53-5.26 1.48 1.48 0 0 1 1.15-2.09c.3-.04.61.02.88.17a12.52 12.52 0 0 0 16.54 2.35c4.01-2.7 7.51-8.54 4.1-16.07a1.48 1.48 0 0 1 .77-1.83c.16-.08.34-.12.51-.13Z' fill='%23000'/%3E%3C/g%3E%3Cg transform='matrix(1.5625 0 0 1.5625 31.25 59.38)'%3E%3Cpath d='M87.22 13.98c0-7.2-5.82-13.04-13-13.04s-13 5.84-13 13.04v3.92c0 7.2 5.82 13.04 13 13.04s13-5.83 13-13.04v-3.92Z' fill='%23000'/%3E%3Cpath d='M70 10.48a2.29 2.29 0 1 0 0-4.58 2.29 2.29 0 0 0 0 4.58Z' fill='%23fff'/%3E%3Cpath opacity='.1' d='M74.24 19.3a5.32 5.32 0 1 0 0-10.66 5.32 5.32 0 0 0 0 10.65Z' fill='%23fff'/%3E%3Cpath d='M26.22 13.98c0-7.2-5.82-13.04-13-13.04s-13 5.84-13 13.04v3.92c0 7.2 5.82 13.04 13 13.04s13-5.83 13-13.04v-3.92Z' fill='%23000'/%3E%3Cpath d='M9 10.48A2.29 2.29 0 1 0 9 5.9a2.29 2.29 0 0 0 0 4.58Z' fill='%23fff'/%3E%3Cpath opacity='.1' d='M13.24 19.3a5.32 5.32 0 1 0 0-10.66 5.32 5.32 0 0 0 0 10.65Z' fill='%23fff'/%3E%3Cpath d='M84.33-5.7H65.45C58.63-5.7 53.1-.2 53.1 6.6v18.8c0 6.79 5.52 12.3 12.34 12.3h18.88c6.81 0 12.34-5.51 12.34-12.3V6.6c0-6.8-5.53-12.3-12.34-12.3Z' fill='url(%23eyesGlasses-a)'/%3E%3Cpath d='M21.3-5.7H2.42C-4.4-5.7-9.92-.2-9.92 6.6v18.8c0 6.79 5.52 12.3 12.34 12.3H21.3c6.81 0 12.34-5.51 12.34-12.3V6.6c0-6.8-5.53-12.3-12.34-12.3Z' fill='url(%23eyesGlasses-b)'/%3E%3Cg fill='%23000'%3E%3Cpath d='M21.06 40.12H2.18A14.83 14.83 0 0 1-8.2 35.81a14.71 14.71 0 0 1-4.33-10.34V6.6c.02-3.87 1.58-7.59 4.34-10.34A14.85 14.85 0 0 1 2.18-8.06h18.88c3.92.02 7.66 1.58 10.42 4.35 2.76 2.76 4.31 6.5 4.31 10.4v18.7A14.62 14.62 0 0 1 26.71 39c-1.79.74-3.7 1.12-5.65 1.12ZM2.18-3.26A9.96 9.96 0 0 0-7 2.83a9.85 9.85 0 0 0-.76 3.78v18.8a9.85 9.85 0 0 0 9.9 9.86h18.92a9.93 9.93 0 0 0 9.9-9.86V6.6a9.87 9.87 0 0 0-9.9-9.86H2.18ZM84.33 40.12H65.46a14.83 14.83 0 0 1-10.39-4.31 14.71 14.71 0 0 1-4.33-10.34V6.6c.02-3.87 1.58-7.59 4.34-10.34a14.85 14.85 0 0 1 10.38-4.32h18.87c3.9.03 7.65 1.59 10.41 4.35s4.31 6.5 4.32 10.4v18.7c0 3.9-1.56 7.64-4.32 10.4a14.83 14.83 0 0 1-10.41 4.33ZM65.46-3.26a9.93 9.93 0 0 0-9.9 9.87v18.8a9.85 9.85 0 0 0 9.9 9.86h18.87a9.93 9.93 0 0 0 9.9-9.86V6.6a9.85 9.85 0 0 0-9.9-9.86H65.46Z'/%3E%3Cpath d='M53.1 10.64H33.4v4.89h19.7v-4.89Z'/%3E%3C/g%3E%3Cdefs%3E%3ClinearGradient id='eyesGlasses-a' x1='2332.67' y1='1561.82' x2='3621.21' y2='1561.82' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23fff' stop-opacity='.3'/%3E%3Cstop offset='.5' stop-color='%23969696' stop-opacity='.2'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='.3'/%3E%3C/linearGradient%3E%3ClinearGradient id='eyesGlasses-b' x1='2269.64' y1='1561.82' x2='3558.18' y2='1561.82' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23fff' stop-opacity='.3'/%3E%3Cstop offset='.5' stop-color='%23969696' stop-opacity='.2'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;


/**
 * signUp
 * Starts the onboarding process for a new user.
 * @param params Object: { email, ... }
 * @returns MutationResult
 */
export async function signUp(params: {
  full_name: string,
  email: string,
  phone?: string,
  telegram?: string
}) { 
  // 1. If no email/full_name/account_id => Error BAD_REQUEST (incomplete params)
  if (!params.email) 
    return Errors.MissingParams(_.missing_param('email', 'sign_up'));
  if (!params.full_name) 
    return Errors.MissingParams(_.missing_param('full_name', 'sign_up'));

  // 2. If received email exists in `persons` table => Error CONFLICT (already exists)
  const noPerson = await prisma.person.findUnique({
    where: { email: params.email }
  }); 
  if (noPerson !== null) 
    return Errors.Conflict(_.persons_already_registered(params.email));

  // 3. Create default values for fields 'avatar' and 'preferences'
  const defaultPrefs = {};

  // 4. Insert into `personas(email, state:PENDING, ...params)` 
  const person = await prisma.person.create({ 
    data: { 
      uid: randomUUID(),
      accountId: "",
      state: PersonState.PENDING,
      fullName: params.full_name, 
      email: params.email, 
      phone: params.phone || "",
      telegram: params.telegram || "",
      avatar: DEFAULT_AVATAR,
      preferences: defaultPrefs,
    }
  })
  if (! person) 
    return Errors.DatabaseEngine(_.database_error("insert into table Persons"));  
  
  console.log(`sign_up params=`, params);
  console.log(`sign_up result=`, person);
  
  // 5. Return the fully created Person data
  return formatMutationResult({
    profile: {
      uid: person.uid,
      state: person.state,
      email: person.email,
      full_name: person.fullName,
      phone: person.phone,
      telegram: person.telegram,
      account_id: person.accountId,
      avatar: person.avatar,
      preferences: person.preferences,
      created_utc: person.createdUtc,
      updated_utc: person.updatedUtc
    }
  });
}
