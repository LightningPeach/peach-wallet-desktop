export const LoginPath = "login";
export const CreatePath = "create";
export const HomePath = "/home";
export const WalletPath = "/wallet";
export const ConfirmPath = "confirm";
export const ProfilePath = "profile";
export const StreamPath = "stream";
export const StreamCreatePath = "create";
export const StreamViewPath = "view";
export const LightningPath = "lightning";
export const OnchainPath = "onchain";
export const ChannelsPath = "channels";
export const AddressBookPath = "addressbook";
export const MerchantsPath = "merchants";
export const GuidePath = "/tourgide";

export const HomeFullPath = HomePath;
export const ProfileFullPath = `${WalletPath}/${ProfilePath}`;
export const ConfirmFullPath = `${WalletPath}/${ConfirmPath}`;
export const StreamFullPath = `${WalletPath}/${StreamPath}`;
export const StreamCreateFullPath = `${WalletPath}/${StreamPath}/${StreamCreatePath}`;
export const StreamViewFullPath = `${WalletPath}/${StreamPath}/${StreamViewPath}`;
export const CreateFullPath = `${HomePath}/${CreatePath}`;
export const LoginFullPath = `${HomePath}/${LoginPath}`;
export const MerchantsFullPath = `${WalletPath}/${MerchantsPath}`;

export const LightningFullPath = `${WalletPath}/${LightningPath}`;
export const OnchainFullPath = `${WalletPath}/${OnchainPath}`;
export const ChannelsFullPath = `${WalletPath}/${ChannelsPath}`;
export const AddressBookFullPath = `${WalletPath}/${AddressBookPath}`;

export const ProfilePanel = [ProfileFullPath];
export const PaymentsPanel = [WalletPath];
export const StreamPanel = [StreamFullPath];
export const StreamCreatePanel = [StreamCreateFullPath];
export const StreamViewPanel = [StreamViewFullPath];

export const LightningPanel = [WalletPath];
export const OnchainPanel = [OnchainFullPath];
export const ChannelsPanel = [ChannelsFullPath];
export const AddressBookPanel = [AddressBookFullPath];
export const MerchantsPanel = [MerchantsFullPath];
