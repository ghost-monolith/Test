'use strict';
const express = require('express');
const crypto = require('node:crypto');
const app = express();
const PORT = Number(process.env.PORT || 3000);
const events = [];
const allowed = new Set(['session_started','card_step_opened','card_step_submitted','otp_step_opened','otp_step_submitted','scenario_completed','scenario_abandoned']);
app.use(express.json({limit:'2kb'}));
app.use(express.static('public'));
function safeText(v, max=32) { return String(v || '').replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,max); }
async function notifyTelegram(e) {
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  const labels = {
    session_started:'ĞĞ¾Ğ²Ğ°Ñ ÑƒÑ‡ĞµĞ±Ğ½Ğ°Ñ ÑĞµÑÑĞ¸Ñ', card_step_opened:'ĞÑ‚ĞºÑ€Ñ‹Ñ‚ ÑĞºÑ€Ğ°Ğ½ ĞºĞ°Ñ€Ñ‚Ñ‹',
    card_step_submitted:'Ğ¢ĞµÑÑ‚Ğ¾Ğ²Ğ°Ñ Ñ„Ğ¾Ñ€Ğ¼Ğ° ĞºĞ°Ñ€Ñ‚Ñ‹ Ğ¾Ñ‚Ğ¿Ñ€Ğ°Ğ²Ğ»ĞµĞ½Ğ°', otp_step_opened:'ĞÑ‚ĞºÑ€Ñ‹Ñ‚ ÑĞºÑ€Ğ°Ğ½ Ñ‚ĞµÑÑ‚Ğ¾Ğ²Ğ¾Ğ³Ğ¾ SMS',
    otp_step_submitted:'Ğ’Ğ²ĞµĞ´Ñ‘Ğ½ Ğ²Ñ‹Ğ¼Ñ‹ÑˆĞ»ĞµĞ½Ğ½Ñ‹Ğ¹ ĞºĞ¾Ğ´ (ÑĞ°Ğ¼ ĞºĞ¾Ğ´ Ğ½Ğµ ÑĞ¾Ğ±Ğ¸Ñ€Ğ°ĞµÑ‚ÑÑ)',
    scenario_completed:'Ğ£Ñ‡ĞµĞ±Ğ½Ñ‹Ğ¹ ÑÑ†ĞµĞ½Ğ°Ñ€Ğ¸Ğ¹ Ğ·Ğ°Ğ²ĞµÑ€ÑˆÑ‘Ğ½', senario_abandoned:'Ğ¡Ñ†ĞµĞ½Ğ°Ñ€Ğ¸Ğ¹ Ğ¿Ñ€ĞµÑ€Ğ°Ğ½Ğ½'
  };
  const message = [
    'ğŸ“ VELVET LUXE â€” M	]		İ	
ò
		Í
=	½
ı
m	
òrÀ¢Æ&VÇ5¶RçG—UÒÇÂ}
=}]İíRí½-RrÀ¢
]ó¢G¶Rç6W76–öçÖÀ¢
-=M]İ#¢G¶Rç7GVFVçGÖÀ¢	-]Íó¢G¶RçF–ÖWÖÀ¢rrÀ¢}	ı]]Mİİ½Rıí½ò­-²ô5ebôõE¢	İ	]
"rÀ¢}
]mÃ¢DTÔò(	B}İ}]İòİRí]İıí-ò‚İRı]]½½í-òâp¢Òæ¦ö–â‚uÆâr“°¢G'’°¢v—BfWF6‚†‡GG3¢òö’çFVÆVw&Òæ÷&rö&÷BG·Fö¶VçÒ÷6VæDÖW76vVÂ°¢ÖWF†öC¢uõ5BrÂ†VFW'3§²v6öçFVçB×G—Rs¢vÆ–6F–öâö§6öâwÒÀ¢&öG“¤¥4ôâç7G&–æv–g’‡¶6†Eö–C¦6†D–BÇFW‡C¦ÖW76vWÒ¢Ò“°¢Ò6F6‚†W'"’²6öç6öÆRæW'&÷"‚uFVÆVw&Òæ÷F–f–6F–öâf–ÆVC¢rÂW'"æÖW76vR“²Ğ§Ğ¦ç÷7B‚rö’öWfVçBrÂ7–æ2‡&WÇ&W2’Óâ°¢6öç7BG—RÒ&Wæ&öG“òçG—S°¢–b‚ÆÆ÷vVBæ†2‡G—R’’&WGW&â&W2ç7FGW2ƒC’æ§6öâ‡¶W'&÷#¢uVç7W÷'FVBFVÖòWfVçBwÒ“°¢òòFVÆ–&W&FVÇ’66WBöæÇ’7GVFVçBÆ&VÂâæòf÷&Òf–VÆBfÇVW2&R66WFVBà¢6öç7B7GVFVçBÒ6fUFW‡B‡&Wæ&öG“òç7GVFVçBÇÂ}
-=M]İ"rÂ#B’ÇÂ}
-=M]İ"s°¢6öç7B6W76–öâÒ6fUFW‡B‡&Wæ&öG“òç6W76–öâÂb’ÇÂ7'—Fòç&æFöÔ'—FW2ƒB’çFõ7G&–ær‚v†W‚r’çFõWW$66R‚“°¢6öç7BRÒ·G—RÇ7GVFVçBÇ6W76–öâÇF–ÖS¦æWrFFR‚’çFôÆö6ÆU7G&–ær‚w'RÕ%RrÇ·F–ÖU¦öæS¢tWW&÷Rô·–—bwÒ—Ó°¢WfVçG2çVç6†–gB†R“²–b†WfVçG2æÆVæwF‚â’WfVçG2ç÷‚“°¢v—Bæ÷F–g•FVÆVw&Ò†R“°¢&W2æ§6öâ‡¶ö³§G'VWÒ“°§Ò“°¦ævWB‚rö’öWfVçG2rÂ‡&WÇ&W2“Óç&W2æ§6öâ†WfVçG2’“°¦ævWB‚rö†VÇF‚rÂ‡&WÇ&W2“Óç&W2æ§6öâ‡¶ö³§G'VRÆÖöFS¢v—6öÆFVBÖ6Æ77&ööÒÖFVÖòwÒ’“°¦æÆ—7FVâ…õ%BÂ‚“Óæ6öç6öÆRæÆör†dTÅdUB6Æ77&ööÒFVÖòÆ—7FVæ–æröâGµõ%GÖ’“°