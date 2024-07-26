"use strict";

const AID = '@lumjs/web-app/ctx~';

module.exports =
{
  AUTO_ID_STRIP: /Ext(ension)?$/i,

  DATA_MAPS: Symbol(AID+"DATA_MAPS"),
  EXTS_LIST: Symbol(AID+"EXTS_LIST"),
  INITED:    Symbol(AID+"INITED"),
  STARTED:   Symbol(AID+"STARTED"),
  REGISTRY:  Symbol(AID+"REGISTRY"),

  EXT_APP:   Symbol(AID+"EXT_APP"),
  EXT_VALID: Symbol(AID+"EXT_VALID"),
}
