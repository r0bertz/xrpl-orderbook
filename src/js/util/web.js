/**
 * Return the address of a contact.
 *
 * Pass in an address or a contact name and get an address back.
 */
exports.resolveContact = function (contacts, value)
{
  for (var i = 0, l = contacts.length; i < l; i++) {
    if (contacts[i].name === value) {
      return contacts[i].address;
    }
  }

  if (RippleAddressCodec.isValidAddress(value)) {
    return value;
  }

  return '';
};
