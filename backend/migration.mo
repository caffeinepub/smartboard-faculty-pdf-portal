import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  type OldActor = {
    currentUserProfiles : Map.Map<Principal, { name : Text }>;
    accessControlState : AccessControl.AccessControlState;
    pdfs : Map.Map<Nat, { id : Nat; title : Text; contentBase64 : Text; assignedFaculty : [Text]; isTaught : Bool }>;
  };

  type NewActor = {
    currentUserProfiles : Map.Map<Principal, { name : Text }>;
    accessControlState : AccessControl.AccessControlState;
    pdfs : Map.Map<Nat, { id : Nat; title : Text; contentBase64 : Text; assignedFaculty : [Text]; isTaught : Bool }>;
    currentPlan : ?{
      tier : { #basic; #premium; #diamond };
      cycle : { #monthly; #quarterly; #halfYearly; #yearly };
      maxFaculty : Nat;
      maxPdfLimit : Nat;
      maxLicenses : Nat;
      priceInr : Nat;
    };
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      currentPlan = null;
    };
  };
};
