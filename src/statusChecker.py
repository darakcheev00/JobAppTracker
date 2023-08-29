import os.path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from base64 import urlsafe_b64decode, urlsafe_b64encode

import openai
import tiktoken
from datetime import datetime
import calendar

"""
TODO:
- make <invitetoapply@indeed.com> an automatic skip gpt

"""


SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class StatusChecker:

    def __init__(self,numEmails):
        openai.api_key = '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'


        self.context = "You are a job application email analyzer. The emails are sent from the employer that I have applied to. \
            The emails i provide to you are in the format: gptInput = {'sender':msg['sender'],'subject':msg['subject'],'body':msg['body']}.\
            read this email and output these things: 1) Company name, position name. If not found then write 'unspecified' 2) one word. which \
            describes the email best. here are the output options: ['application received', 'rejected', 'interview requested', 'received offer','not related to job application','invited to apply'] \
            in this format: \
            company:'companyname' \
            position:'positionname' \
            status:'one of the valid results' \
            \
            Note: text after ':' should be in ''"
        
        self.encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        self.context_token_count = len(self.encoding.encode(self.context))
        self.valid_token_count = 4097 - self.context_token_count
        
        self.messageThread = [ {"role": "system", "content": self.context} ]
        self.numEmails = numEmails

        self.invalidSenders = ['@linkedin.com','@remotemore.com','@eg.vrbo.com','@send.grammarly.com','@mailtrack.io',
                                '@weworkremotely.com','getpocket_com,','spotangels','silkandsnow.com','@github.com',
                                'order.eventbrite.com','invitetoapply@indeed.com']
        
        self.translations = {
            'application received':"Applied",
            'rejected':'Not Selected',
            'interview requested':'Selected for Interview',
            'received offer':'Offer received',
            'not related to job application':'na',
            'invited to apply':'na'
        }
        
        self.applications = {}

    
    def resetMsgThread(self):
        self.messageThread = [ {"role": "system", "content": self.context} ]

    def search_messages(self,service,query):
        result = service.users().messages().list(userId='me',q =query).execute()
        messages = []
        if 'messages' in result:
            messages.extend(result['messages'])
        
        while 'nextPageToken' in result:
            page_token = result['nextPageToken']
            result = service.users().messages().list(userId='me',q=query, pageToken=page_token).execute()
            if 'messages' in result:
                messages.extend(result['messages'])
        
        return messages

    def get_body(self, parts):
        text = ""
        # print(parts)
        if parts:
            for part in parts:
                filename = part.get("filename")
                mimeType = part.get("mimeType")
                body = part.get("body")
                data = body.get("data")
                file_size = body.get("size")
                part_headers = part.get("headers")

                if mimeType == "text/plain" or mimeType == "text/html":
                    # if the email part is text plain
                    if data:
                        text += "\n" + urlsafe_b64decode(data).decode()

        return text


    def readMessage(self, service, message):
        msg = service.users().messages().get(userId='me', id=message['id'], format='full').execute()
        payload = msg['payload']

        headers = payload.get('headers')
        parts = payload.get('parts')

        simpleMsg = {}

        for header in headers:
            name,value = header['name'].lower(), header['value']
            if name == 'from':
                simpleMsg['sender'] = value
            elif name == 'subject':
                simpleMsg['subject'] = value
            elif name == 'date':
                simpleMsg['date'] = value

        if not parts and payload.get('body'):
            temp = payload.get('body').get('data')
            simpleMsg['body'] = urlsafe_b64decode(temp).decode()
        else:
            simpleMsg['body'] = self.get_body(parts)

        # print(simpleMsg['sender'],simpleMsg['date'])

        valid = True

        for i in self.invalidSenders:
            if i in simpleMsg['sender']:
                valid = False
                # print("invalid sender")
                break
    
        return simpleMsg, valid

    def askGPT(self, prompt):
        self.messageThread.append({"role": "user", "content": prompt})
        chat = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=self.messageThread)
        reply = chat.choices[0].message.content
        # print(f"{reply}")
        # self.messageThread.append({"role": "assistant", "content": reply})
        self.resetMsgThread()
        return reply
        
    def checkTokenCount(self,text):
        token_count = len(self.encoding.encode(text))
        # print(f"The text contains {token_count} tokens.")
        return token_count < self.valid_token_count
    
    def getEpochTime(self,y=2023,m=8,d=24,h=0,mi=0,s=0):
        t = datetime.utcnow()
        # print(t)
        # t=datetime.datetime(y, m, d, h, mi, s)
        return calendar.timegm(t.timetuple())
    
    def parseGPTResult(self,raw):
        res = {'company':"",'position':"",'status':""}
        lines = raw.split('\n')
        for i, line in enumerate(lines):
            parts = line.split(':')
            category = parts[0]
            val = parts[1].strip()[1:-1]

            if category == 'status':
                val = self.translations[val]
            res[category] = val
        
        return res
    
    

    def applyUpdates(self,updates):
        for update in updates:
            company = update.get('company')
            position = update.get('position')
            status = update.get('status')
            # date = update.get('date')

            update.pop('company')
            update.pop('position')

            if company in self.applications:
                if position not in self.applications[company]:
                    self.applications[company][position] = update
                else:
                    if status == 'Applied':
                        print("Error: already applied for this position")
                    else:
                        self.applications[company][position]['status'] = status
            else:
                self.applications[company] = {
                    position:update
                }

        print(self.applications)


    def run(self):
        creds = None

        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())

            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json',SCOPES)
                creds = flow.run_local_server(port=0)

            # save the credentials for the next run
            with open('token.json','w') as token:
                token.write(creds.to_json())

        validUpdates = []

        try:
            service = build('gmail','v1',credentials=creds)

            timeStamp = self.getEpochTime(y=2023,m=8,d=24,h=19,mi=0,s=0)

            query = f"in:inbox after:{timeStamp}"
            messages = self.search_messages(service, query)
            print(f"Number of messages: {len(messages)}")

            for i in range(len(messages)):
                msg,valid = self.readMessage(service, messages[i])
                print(i, msg['date'])
                if valid:                      
               
                    gptInput = {
                        'sender':msg['sender'],
                        'subject':msg['subject'],
                        'body':msg['body']
                    }
                    prompt = str(gptInput)
                    if not self.checkTokenCount(prompt):
                        continue

                    print(f"\n{i} ===================================")
                    # print(gptInput['sender'], msg['date'])
                    result = self.askGPT(prompt)
                    parsed = self.parseGPTResult(result)
                    parsed['date'] = msg['date']

                    if parsed['status'] != 'na':
                        validUpdates.append(parsed)

            # update application status's
            for v in validUpdates:
                print(v)

            self.applyUpdates(validUpdates)

                
        except HttpError as error:
            print(f'an error occured: {error}')

if __name__ == '__main__':
    checker = StatusChecker(10)
    checker.run()